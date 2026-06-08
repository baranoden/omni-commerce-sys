import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import {
  StockReservation,
  StockReservationStatus,
} from './stock-reservation.entity';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

interface OrderCreatedEvent {
  orderId: number;
  sagaId: string;
  createdByUserId: number;
  currency: string;
  paymentMethodToken: string;
  items: Array<{ productId: number; quantity: number }>;
  simulatePaymentFailure?: boolean;
  simulateStockFailure?: boolean;
}

interface PaymentResultEvent {
  orderId: number;
  sagaId: string;
  reason?: string;
}

@Injectable()
export class ProductsService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(StockReservation)
    private readonly stockReservationsRepository: Repository<StockReservation>,
    @Inject('PRODUCT_EVENTS_CLIENT')
    private readonly productEventsClient: ClientKafka,
  ) {}

  async onApplicationBootstrap() {
    await this.productEventsClient.connect();
  }

  async onModuleDestroy() {
    await this.productEventsClient.close();
  }

  async create(
    createProductDto: CreateProductDto & { createdByUserId: number },
  ) {
    await this.ensureSkuIsAvailable(createProductDto.sku);

    const product = this.productsRepository.create({
      ...createProductDto,
      isActive: createProductDto.isActive ?? true,
    });

    const savedProduct = await this.productsRepository.save(product);

    this.productEventsClient.emit('catalog.product.created', {
      productId: savedProduct.id,
      sku: savedProduct.sku,
      createdByUserId: createProductDto.createdByUserId,
      occurredAt: new Date().toISOString(),
    });

    return savedProduct;
  }

  findAll() {
    return this.productsRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      await this.ensureSkuIsAvailable(updateProductDto.sku);
    }

    Object.assign(product, updateProductDto);

    const updatedProduct = await this.productsRepository.save(product);

    this.productEventsClient.emit('catalog.product.updated', {
      productId: updatedProduct.id,
      sku: updatedProduct.sku,
      changedFields: Object.keys(updateProductDto),
      occurredAt: new Date().toISOString(),
    });

    return updatedProduct;
  }

  async remove(id: number) {
    const product = await this.findOne(id);

    await this.productsRepository.remove(product);

    this.productEventsClient.emit('catalog.product.deleted', {
      productId: id,
      sku: product.sku,
      occurredAt: new Date().toISOString(),
    });

    return {
      id,
    };
  }

  async reserveStockForOrder(payload: OrderCreatedEvent) {
    if (payload.simulateStockFailure === true) {
      this.productEventsClient.emit('stock.failed', {
        orderId: payload.orderId,
        sagaId: payload.sagaId,
        reason: 'Stok yok',
        occurredAt: new Date().toISOString(),
      });

      return;
    }

    const existingReservations = await this.stockReservationsRepository.find({
      where: { orderId: payload.orderId },
      order: { productId: 'ASC' },
    });

    if (existingReservations.length > 0) {
      if (
        existingReservations.every(
          (reservation) =>
            reservation.status === StockReservationStatus.RESERVED,
        )
      ) {
        this.emitStockReserved(payload, existingReservations);
      }

      return;
    }

    try {
      const reservations = await this.productsRepository.manager.transaction(
        async (manager) => {
          return this.createReservations(manager, payload);
        },
      );

      this.emitStockReserved(payload, reservations);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Stok rezervasyonu başarısız';

      this.productEventsClient.emit('stock.failed', {
        orderId: payload.orderId,
        sagaId: payload.sagaId,
        reason,
        occurredAt: new Date().toISOString(),
      });
    }
  }

  async confirmReservation(payload: PaymentResultEvent) {
    const completedReservations = await this.stockReservationsRepository.find({
      where: {
        orderId: payload.orderId,
        status: StockReservationStatus.COMPLETED,
      },
      order: { productId: 'ASC' },
    });

    if (completedReservations.length > 0) {
      this.emitStockDecreased(payload, completedReservations);
      return;
    }

    const reservations = await this.productsRepository.manager.transaction(
      async (manager) => {
        const reservationRepository = manager.getRepository(StockReservation);
        const reservationsToComplete = await reservationRepository.find({
          where: {
            orderId: payload.orderId,
            status: StockReservationStatus.RESERVED,
          },
          order: { productId: 'ASC' },
        });

        if (reservationsToComplete.length === 0) {
          return [];
        }

        for (const reservation of reservationsToComplete) {
          const product = await manager
            .createQueryBuilder(Product, 'product')
            .setLock('pessimistic_write')
            .where('product.id = :productId', {
              productId: reservation.productId,
            })
            .getOne();

          if (!product) {
            throw new NotFoundException(
              `Ürün bulunamadı: ${reservation.productId}`,
            );
          }

          product.stock -= reservation.quantity;
          reservation.status = StockReservationStatus.COMPLETED;

          await manager.save(product);
          await reservationRepository.save(reservation);
        }

        return reservationsToComplete;
      },
    );

    if (reservations.length === 0) {
      return;
    }

    this.emitStockDecreased(payload, reservations);
  }

  async releaseReservation(payload: PaymentResultEvent) {
    const releasedReservations = await this.stockReservationsRepository.find({
      where: {
        orderId: payload.orderId,
        status: StockReservationStatus.RELEASED,
      },
      order: { productId: 'ASC' },
    });

    if (releasedReservations.length > 0) {
      this.emitStockReleased(payload);
      return;
    }

    const reservations = await this.productsRepository.manager.transaction(
      async (manager) => {
        const reservationRepository = manager.getRepository(StockReservation);
        const reservationsToRelease = await reservationRepository.find({
          where: {
            orderId: payload.orderId,
            status: StockReservationStatus.RESERVED,
          },
          order: { productId: 'ASC' },
        });

        if (reservationsToRelease.length === 0) {
          return [];
        }

        for (const reservation of reservationsToRelease) {
          reservation.status = StockReservationStatus.RELEASED;
          await reservationRepository.save(reservation);
        }

        return reservationsToRelease;
      },
    );

    if (reservations.length === 0) {
      return;
    }

    this.emitStockReleased(payload);
  }

  async checkStock(items: Array<{ productId: number; quantity: number }>) {
    const normalizedItems = this.normalizeItems(items);
    const products = await this.getValidatedProducts(normalizedItems);

    const responseItems = normalizedItems.map((item) => {
      const product = products.get(item.productId);

      if (!product) {
        throw new NotFoundException(`Ürün bulunamadı: ${item.productId}`);
      }

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        lineTotal: this.toMoney(Number(product.price) * item.quantity),
        availableStock: product.stock,
      };
    });

    return {
      items: responseItems,
      totalAmount: this.toMoney(
        responseItems.reduce((sum, item) => sum + item.lineTotal, 0),
      ),
      checkedAt: new Date().toISOString(),
    };
  }

  async decrementStock(
    orderId: number,
    items: Array<{ productId: number; quantity: number }>,
  ) {
    const normalizedItems = this.normalizeItems(items);

    const updatedProducts = await this.productsRepository.manager.transaction(
      async (manager) => {
        const validatedProducts = await this.getValidatedProducts(
          normalizedItems,
          (productId) =>
            manager
              .createQueryBuilder(Product, 'product')
              .setLock('pessimistic_write')
              .where('product.id = :productId', { productId })
              .getOne(),
        );
        const touchedProducts: Product[] = [];

        for (const item of normalizedItems) {
          const product = validatedProducts.get(item.productId);

          if (!product) {
            throw new NotFoundException(`Ürün bulunamadı: ${item.productId}`);
          }

          product.stock -= item.quantity;
          touchedProducts.push(await manager.save(product));
        }

        return touchedProducts;
      },
    );

    this.productEventsClient.emit('catalog.stock.decremented', {
      orderId,
      items: updatedProducts.map((product) => ({
        productId: product.id,
        sku: product.sku,
        remainingStock: product.stock,
      })),
      occurredAt: new Date().toISOString(),
    });

    return {
      orderId,
      success: true,
    };
  }

  async incrementStock(
    orderId: number,
    items: Array<{ productId: number; quantity: number }>,
  ) {
    const normalizedItems = this.normalizeItems(items);

    const updatedProducts = await this.productsRepository.manager.transaction(
      async (manager) => {
        const touchedProducts: Product[] = [];

        for (const item of normalizedItems) {
          const product = await manager
            .createQueryBuilder(Product, 'product')
            .setLock('pessimistic_write')
            .where('product.id = :productId', { productId: item.productId })
            .getOne();

          if (!product) {
            throw new NotFoundException(`Ürün bulunamadı: ${item.productId}`);
          }

          product.stock += item.quantity;
          touchedProducts.push(await manager.save(product));
        }

        return touchedProducts;
      },
    );

    this.productEventsClient.emit('catalog.stock.incremented', {
      orderId,
      items: updatedProducts.map((product) => ({
        productId: product.id,
        sku: product.sku,
        stock: product.stock,
      })),
      occurredAt: new Date().toISOString(),
    });

    return {
      orderId,
      success: true,
    };
  }

  private async createReservations(
    manager: EntityManager,
    payload: OrderCreatedEvent,
  ) {
    const normalizedItems = this.normalizeItems(payload.items);
    const reservations: StockReservation[] = [];
    const reservationRepository = manager.getRepository(StockReservation);

    for (const item of normalizedItems) {
      const product = await manager
        .createQueryBuilder(Product, 'product')
        .setLock('pessimistic_write')
        .where('product.id = :productId', { productId: item.productId })
        .getOne();

      if (!product) {
        throw new NotFoundException(`Ürün bulunamadı: ${item.productId}`);
      }

      if (!product.isActive) {
        throw new ConflictException(`Ürün satışa kapalı: ${product.name}`);
      }

      const reservedQuantity = await this.getReservedQuantity(
        reservationRepository,
        item.productId,
      );
      const availableStock = product.stock - reservedQuantity;

      if (availableStock < item.quantity) {
        throw new ConflictException(`Yetersiz stok: ${product.name}`);
      }

      const reservation = await reservationRepository.save(
        reservationRepository.create({
          orderId: payload.orderId,
          sagaId: payload.sagaId,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice: Number(product.price),
          lineTotal: this.toMoney(Number(product.price) * item.quantity),
          status: StockReservationStatus.RESERVED,
        }),
      );

      reservations.push(reservation);
    }

    return reservations;
  }

  private emitStockReserved(
    payload: OrderCreatedEvent,
    reservations: StockReservation[],
  ) {
    this.productEventsClient.emit('stock.reserved', {
      orderId: payload.orderId,
      sagaId: payload.sagaId,
      createdByUserId: payload.createdByUserId,
      paymentMethodToken: payload.paymentMethodToken,
      simulatePaymentFailure: payload.simulatePaymentFailure,
      currency: payload.currency ?? 'TRY',
      items: reservations.map((reservation) => ({
        productId: reservation.productId,
        productName: reservation.productName,
        sku: reservation.sku,
        quantity: reservation.quantity,
        unitPrice: Number(reservation.unitPrice),
        lineTotal: Number(reservation.lineTotal),
      })),
      totalAmount: this.toMoney(
        reservations.reduce(
          (sum, reservation) => sum + Number(reservation.lineTotal),
          0,
        ),
      ),
      occurredAt: new Date().toISOString(),
    });
  }

  private emitStockDecreased(
    payload: PaymentResultEvent,
    reservations: StockReservation[],
  ) {
    this.productEventsClient.emit('stock.decreased', {
      orderId: payload.orderId,
      sagaId: payload.sagaId,
      items: reservations.map((reservation) => ({
        productId: reservation.productId,
        productName: reservation.productName,
        sku: reservation.sku,
        quantity: reservation.quantity,
        unitPrice: Number(reservation.unitPrice),
        lineTotal: Number(reservation.lineTotal),
      })),
      totalAmount: this.toMoney(
        reservations.reduce(
          (sum, reservation) => sum + Number(reservation.lineTotal),
          0,
        ),
      ),
      currency: 'TRY',
      occurredAt: new Date().toISOString(),
    });
  }

  private emitStockReleased(payload: PaymentResultEvent) {
    this.productEventsClient.emit('stock.released', {
      orderId: payload.orderId,
      sagaId: payload.sagaId,
      reason:
        payload.reason ?? 'Ödeme başarısız olduğu için stok serbest bırakıldı',
      occurredAt: new Date().toISOString(),
    });
  }

  private async getReservedQuantity(
    reservationRepository: Repository<StockReservation>,
    productId: number,
  ) {
    const result = await reservationRepository
      .createQueryBuilder('reservation')
      .select('COALESCE(SUM(reservation.quantity), 0)', 'reservedQuantity')
      .where('reservation.productId = :productId', { productId })
      .andWhere('reservation.status = :status', {
        status: StockReservationStatus.RESERVED,
      })
      .getRawOne<{ reservedQuantity: string }>();

    return Number(result?.reservedQuantity ?? 0);
  }

  private async ensureSkuIsAvailable(sku: string) {
    const existingProduct = await this.productsRepository.findOne({
      where: { sku },
    });

    if (existingProduct) {
      throw new ConflictException('Bu SKU ile kayıtlı ürün zaten mevcut');
    }
  }

  private async getValidatedProducts(
    items: Array<{ productId: number; quantity: number }>,
    findProduct: (productId: number) => Promise<Product | null> = (productId) =>
      this.productsRepository.findOne({
        where: { id: productId },
      }),
  ) {
    const products = new Map<number, Product>();

    for (const item of items) {
      const product = await findProduct(item.productId);

      if (!product) {
        throw new NotFoundException(`Ürün bulunamadı: ${item.productId}`);
      }

      if (!product.isActive) {
        throw new ConflictException(`Ürün satışa kapalı: ${product.name}`);
      }

      if (product.stock < item.quantity) {
        throw new ConflictException(`Yetersiz stok: ${product.name}`);
      }

      products.set(product.id, product);
    }

    return products;
  }

  private toMoney(value: number) {
    return Number(value.toFixed(2));
  }

  private normalizeItems(
    items: Array<{ productId: number; quantity: number }>,
  ) {
    const quantitiesByProductId = new Map<number, number>();

    for (const item of items) {
      quantitiesByProductId.set(
        item.productId,
        (quantitiesByProductId.get(item.productId) ?? 0) + item.quantity,
      );
    }

    return Array.from(quantitiesByProductId.entries()).map(
      ([productId, quantity]) => ({
        productId,
        quantity,
      }),
    );
  }
}
