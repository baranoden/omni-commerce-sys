import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientKafka, ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { CompensationStatus, Order, OrderStatus } from './order.entity';

interface StockCheckResultItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
}

interface StockCheckResult {
  items: StockCheckResultItem[];
  totalAmount: number;
  checkedAt: string;
}

interface StockReservedEvent {
  orderId: number;
  sagaId: string;
  currency: string;
  totalAmount: number;
  items: Array<{
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

interface PaymentCompletedEvent {
  orderId: number;
  sagaId: string;
  transactionId?: string;
}

interface FailureEvent {
  orderId: number;
  sagaId: string;
  reason?: string;
}

type OrderWithSecret = Order & { paymentMethodToken: string };

@Injectable()
export class OrdersService implements OnApplicationBootstrap, OnModuleDestroy {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @Inject('PRODUCTS_SERVICE')
    private readonly productsClient: ClientProxy,
    @Inject('ORDER_EVENTS_CLIENT')
    private readonly orderEventsClient: ClientKafka,
  ) {}

  async onApplicationBootstrap() {
    await this.orderEventsClient.connect();
  }

  async onModuleDestroy() {
    await this.orderEventsClient.close();
  }

  async create(createOrderDto: CreateOrderDto & { createdByUserId: number }) {
    const normalizedItems = this.normalizeItems(createOrderDto.items);
    const stockSnapshot = await this.checkStock(normalizedItems);
    const detailedItems = stockSnapshot.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      productName: item.productName,
      sku: item.sku,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));

    const order = await this.ordersRepository.save(
      this.ordersRepository.create({
        sagaId: randomUUID(),
        createdByUserId: createOrderDto.createdByUserId,
        paymentMethodToken: createOrderDto.paymentMethodToken,
        totalAmount: stockSnapshot.totalAmount,
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

    if (order.status === OrderStatus.CONFIRMED) {
      throw new BadRequestException('Sipariş ödeme süreci zaten başlatıldı');
    }

    order.status = OrderStatus.CONFIRMED;
    order.failureReason = null;
    order.paymentTransactionId = null;

    const pendingOrder = await this.ordersRepository.save(order);

    this.orderEventsClient.emit('order.created', {
      orderId: pendingOrder.id,
      sagaId: pendingOrder.sagaId,
      createdByUserId: pendingOrder.createdByUserId,
      currency: pendingOrder.currency,
      paymentMethodToken: pendingOrder.paymentMethodToken,
      items: pendingOrder.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      simulatePaymentFailure: options.simulatePaymentFailure,
      simulateStockFailure: options.simulateStockFailure,
      occurredAt: new Date().toISOString(),
    });

    return this.sanitizeOrder(pendingOrder);
  }

  async handleStockReserved(payload: StockReservedEvent) {
    const order = await this.findOrderById(payload.orderId);

    if (
      !order ||
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.FAILED
    ) {
      return;
    }

    order.status = OrderStatus.CONFIRMED;
    order.failureReason = null;
    order.currency = payload.currency ?? order.currency;
    order.totalAmount = payload.totalAmount ?? order.totalAmount;
    order.items = order.items.map((item) => {
      const updatedItem = payload.items.find(
        (payloadItem) => payloadItem.productId === item.productId,
      );

      if (!updatedItem) {
        return item;
      }

      item.productName = updatedItem.productName;
      item.sku = updatedItem.sku;
      item.quantity = updatedItem.quantity;
      item.unitPrice = updatedItem.unitPrice;
      item.lineTotal = updatedItem.lineTotal;

      return item;
    });

    await this.ordersRepository.save(order);
  }

  async handleStockFailed(payload: FailureEvent) {
    const failedOrder = await this.markAsFailedById(
      payload.orderId,
      payload.reason ?? 'Stok rezervasyonu başarısız',
    );

    if (!failedOrder) {
      return;
    }

    this.orderEventsClient.emit('order.failed', {
      orderId: failedOrder.id,
      sagaId: failedOrder.sagaId,
      reason: failedOrder.failureReason,
      occurredAt: new Date().toISOString(),
    });
  }

  async handlePaymentCompleted(payload: PaymentCompletedEvent) {
    const order = await this.findOrderById(payload.orderId);

    if (
      !order ||
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.FAILED
    ) {
      return;
    }

    order.status = OrderStatus.COMPLETED;
    order.failureReason = null;
    order.paymentTransactionId = payload.transactionId ?? null;

    const completedOrder = await this.ordersRepository.save(order);

    this.orderEventsClient.emit('order.completed', {
      orderId: completedOrder.id,
      sagaId: completedOrder.sagaId,
      transactionId: completedOrder.paymentTransactionId,
      totalAmount: Number(completedOrder.totalAmount),
      currency: completedOrder.currency,
      occurredAt: new Date().toISOString(),
    });
  }

  async handlePaymentFailed(payload: FailureEvent) {
    const failedOrder = await this.markAsFailedById(
      payload.orderId,
      payload.reason ?? 'Ödeme başarısız',
    );

    if (!failedOrder) {
      return;
    }

    this.orderEventsClient.emit('order.failed', {
      orderId: failedOrder.id,
      sagaId: failedOrder.sagaId,
      reason: failedOrder.failureReason,
      occurredAt: new Date().toISOString(),
    });
  }

  private async markAsFailed(order: Order, reason: string) {
    order.status = OrderStatus.FAILED;
    order.failureReason = reason;
    order.paymentTransactionId = null;

    const failedOrder = await this.ordersRepository.save(order);
    return this.sanitizeOrder(failedOrder);
  }

  private async markAsFailedById(id: number, reason: string) {
    const order = await this.findOrderById(id);

    if (
      !order ||
      order.status === OrderStatus.FAILED ||
      order.status === OrderStatus.COMPLETED
    ) {
      return null;
    }

    return this.markAsFailed(order, reason);
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
    items: Array<{ productId: number; quantity: number }>,
  ): Promise<StockCheckResult> {
    try {
      return await firstValueFrom(
        this.productsClient.send<StockCheckResult, Record<string, unknown>>(
          'product.stock.check',
          {
            items,
          },
        ),
      );
    } catch (error) {
      throw this.mapRpcError(error, 'Ürün servisi hatası oluştu');
    }
  }

  private async findOrderById(id: number) {
    return this.ordersRepository.findOne({
      where: { id },
      order: { id: 'DESC' },
    });
  }

  private mapRpcError(error: unknown, fallbackMessage: string) {
    if (typeof error === 'object' && error !== null) {
      const rpcError = error as {
        statusCode?: number;
        message?: string | string[];
      };

      const message = Array.isArray(rpcError.message)
        ? (rpcError.message[0] ?? fallbackMessage)
        : (rpcError.message ?? fallbackMessage);

      return new HttpException(
        message,
        rpcError.statusCode ?? HttpStatus.BAD_GATEWAY,
      );
    }

    return new HttpException(fallbackMessage, HttpStatus.BAD_GATEWAY);
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
