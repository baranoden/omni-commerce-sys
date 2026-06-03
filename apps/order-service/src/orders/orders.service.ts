import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { CompensationStatus, Order, OrderStatus } from './order.entity';

interface StockCheckResult {
  success: boolean;
  reason?: string;
}

interface PaymentProcessResult {
  success: boolean;
  reason?: string;
  transactionId?: string;
}

type OrderWithSecret = Order & { paymentMethodToken: string };

const MOCK_CATALOG = new Map<
  number,
  { productName: string; sku: string; unitPrice: number }
>([
  [1, { productName: 'Kulaklık', sku: 'PRD-001', unitPrice: 899.9 }],
  [2, { productName: 'Klavye', sku: 'PRD-002', unitPrice: 1249.9 }],
  [3, { productName: 'Mouse', sku: 'PRD-003', unitPrice: 649.9 }],
  [4, { productName: 'Monitör', sku: 'PRD-004', unitPrice: 5399.9 }],
]);

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @Inject('PAYMENT_SERVICE')
    private readonly paymentClient: ClientProxy,
    @Inject('MOCK_STOCK_SERVICE')
    private readonly stockClient: ClientProxy,
  ) {}

  async create(createOrderDto: CreateOrderDto & { createdByUserId: number }) {
    const normalizedItems = this.normalizeItems(createOrderDto.items);
    const detailedItems = normalizedItems.map((item) =>
      this.buildOrderItem(item.productId, item.quantity),
    );
    const totalAmount = detailedItems.reduce(
      (sum, item) => sum + (item.lineTotal ?? 0),
      0,
    );

    const order = await this.ordersRepository.save(
      this.ordersRepository.create({
        sagaId: randomUUID(),
        createdByUserId: createOrderDto.createdByUserId,
        paymentMethodToken: createOrderDto.paymentMethodToken,
        totalAmount,
        currency: 'TRY',
        status: OrderStatus.PENDING,
        compensationStatus: CompensationStatus.NOT_REQUIRED,
        failureReason: null,
        items: detailedItems,
      }),
    );

    return this.sanitizeOrder(order);
  }

  async findMine(userId: number) {
    const orders = await this.ordersRepository.find({
      where: {
        createdByUserId: userId,
      },
      order: {
        id: 'DESC',
      },
    });

    return orders.map((order) => this.sanitizeOrder(order));
  }

  async findOne(id: number, userId: number) {
    const order = await this.ordersRepository.findOne({
      where: {
        id,
        createdByUserId: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }

    return this.sanitizeOrder(order);
  }

  async pay(
    id: number,
    userId: number,
    options: {
      simulatePaymentFailure?: boolean;
      simulateStockFailure?: boolean;
    },
  ) {
    const order = await this.findOrderForPayment(id, userId);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Sipariş zaten ödendi');
    }

    if (order.status === OrderStatus.FAILED) {
      throw new BadRequestException('Başarısız sipariş tekrar ödenemez');
    }

    const stockResult = await this.checkStock(
      order,
      options.simulateStockFailure,
    );

    if (!stockResult.success) {
      return this.markAsFailed(order, stockResult.reason ?? 'Stok yok');
    }

    const paymentResult = await this.processPayment(
      order,
      options.simulatePaymentFailure,
    );

    if (!paymentResult.success) {
      return this.markAsFailed(
        order,
        paymentResult.reason ?? 'Ödeme başarısız',
      );
    }

    order.status = OrderStatus.COMPLETED;
    order.failureReason = null;
    order.paymentTransactionId = paymentResult.transactionId ?? null;

    const completedOrder = await this.ordersRepository.save(order);
    return this.sanitizeOrder(completedOrder);
  }

  private async markAsFailed(order: Order, reason: string) {
    order.status = OrderStatus.FAILED;
    order.failureReason = reason;
    order.paymentTransactionId = null;

    const failedOrder = await this.ordersRepository.save(order);
    return this.sanitizeOrder(failedOrder);
  }

  private async findOrderForPayment(
    id: number,
    userId: number,
  ): Promise<OrderWithSecret> {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .addSelect('order.paymentMethodToken')
      .leftJoinAndSelect('order.items', 'item')
      .where('order.id = :id', { id })
      .andWhere('order.createdByUserId = :userId', { userId })
      .orderBy('item.id', 'ASC')
      .getOne();

    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }

    return order as OrderWithSecret;
  }

  private async checkStock(
    order: Order,
    forceFailure?: boolean,
  ): Promise<StockCheckResult> {
    try {
      return await firstValueFrom(
        this.stockClient.send<StockCheckResult, Record<string, unknown>>(
          'stock.check',
          {
            orderId: order.id,
            items: order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            forceFailure,
          },
        ),
      );
    } catch {
      return {
        success: false,
        reason: 'Stok servisine ulaşılamadı',
      };
    }
  }

  private async processPayment(
    order: OrderWithSecret,
    forceFailure?: boolean,
  ): Promise<PaymentProcessResult> {
    try {
      return await firstValueFrom(
        this.paymentClient.send<PaymentProcessResult, Record<string, unknown>>(
          'payment.process',
          {
            orderId: order.id,
            userId: order.createdByUserId,
            totalAmount: Number(order.totalAmount),
            currency: order.currency,
            paymentMethodToken: order.paymentMethodToken,
            forceFailure,
          },
        ),
      );
    } catch {
      return {
        success: false,
        reason: 'Ödeme servisine ulaşılamadı',
      };
    }
  }

  private buildOrderItem(productId: number, quantity: number) {
    const catalogItem = this.getCatalogItem(productId);
    const lineTotal = Number((catalogItem.unitPrice * quantity).toFixed(2));

    return {
      productId,
      quantity,
      productName: catalogItem.productName,
      sku: catalogItem.sku,
      unitPrice: catalogItem.unitPrice,
      lineTotal,
    };
  }

  private getCatalogItem(productId: number) {
    const catalogItem = MOCK_CATALOG.get(productId);

    if (catalogItem) {
      return catalogItem;
    }

    return {
      productName: `Ürün ${productId}`,
      sku: `PRD-${String(productId).padStart(3, '0')}`,
      unitPrice: Number((99.9 + productId * 10).toFixed(2)),
    };
  }

  private normalizeItems(items: CreateOrderDto['items']) {
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

  private sanitizeOrder<T extends Order>(order: T) {
    if ('paymentMethodToken' in order) {
      Reflect.deleteProperty(order, 'paymentMethodToken');
    }

    return order;
  }
}
