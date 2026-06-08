import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientKafka, ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';

interface PaymentRequest {
  orderId: number;
  sagaId?: string;
  userId: number;
  totalAmount: number;
  currency: string;
  paymentMethodToken: string;
  forceFailure?: boolean;
}

interface MockPaymentResult {
  success: boolean;
  reason?: string;
  transactionId?: string;
  provider?: string;
  occurredAt?: string;
}

interface StockReservedEvent {
  orderId: number;
  sagaId: string;
  createdByUserId: number;
  paymentMethodToken: string;
  currency: string;
  totalAmount: number;
  simulatePaymentFailure?: boolean;
}

@Injectable()
export class PaymentsService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @Inject('MOCK_PAYMENT_SERVICE')
    private readonly mockPaymentClient: ClientProxy,
    @Inject('PAYMENT_EVENTS_CLIENT')
    private readonly paymentEventsClient: ClientKafka,
  ) {}

  async onApplicationBootstrap() {
    await this.paymentEventsClient.connect();
  }

  async onModuleDestroy() {
    await this.paymentEventsClient.close();
  }

  async processPayment(payload: PaymentRequest) {
    const existingPayment = await this.paymentsRepository.findOne({
      where: { orderId: payload.orderId },
    });

    if (existingPayment) {
      return existingPayment.status === PaymentStatus.COMPLETED
        ? {
            success: true,
            transactionId: existingPayment.transactionId ?? undefined,
          }
        : {
            success: false,
            reason: existingPayment.failureReason ?? 'Ödeme başarısız',
          };
    }

    const mockResult = await this.requestMockPayment(payload);
    const payment = this.paymentsRepository.create({
      orderId: payload.orderId,
      sagaId: payload.sagaId ?? `payment-${payload.orderId}`,
      userId: payload.userId,
      amount: payload.totalAmount,
      currency: payload.currency,
      paymentMethodToken: payload.paymentMethodToken,
      transactionId: mockResult.transactionId ?? null,
      provider: mockResult.provider ?? 'mock-payment-service',
      status: mockResult.success
        ? PaymentStatus.COMPLETED
        : PaymentStatus.FAILED,
      failureReason: mockResult.success
        ? null
        : (mockResult.reason ?? 'Ödeme başarısız'),
      completedAt:
        mockResult.success && mockResult.occurredAt
          ? new Date(mockResult.occurredAt)
          : null,
    });

    await this.paymentsRepository.save(payment);

    return mockResult.success
      ? {
          success: true,
          transactionId: payment.transactionId ?? undefined,
        }
      : {
          success: false,
          reason: payment.failureReason ?? 'Ödeme başarısız',
        };
  }

  async processReservedStock(payload: StockReservedEvent) {
    try {
      const result = await this.processPayment({
        orderId: payload.orderId,
        sagaId: payload.sagaId,
        userId: payload.createdByUserId,
        totalAmount: payload.totalAmount,
        currency: payload.currency,
        paymentMethodToken: payload.paymentMethodToken,
        forceFailure: payload.simulatePaymentFailure,
      });

      if (result.success) {
        this.paymentEventsClient.emit('payment.completed', {
          orderId: payload.orderId,
          sagaId: payload.sagaId,
          transactionId: result.transactionId,
          occurredAt: new Date().toISOString(),
        });

        return;
      }

      this.paymentEventsClient.emit('payment.failed', {
        orderId: payload.orderId,
        sagaId: payload.sagaId,
        reason: result.reason ?? 'Ödeme başarısız',
        occurredAt: new Date().toISOString(),
      });
    } catch (error) {
      this.paymentEventsClient.emit('payment.failed', {
        orderId: payload.orderId,
        sagaId: payload.sagaId,
        reason:
          error instanceof Error
            ? error.message
            : 'Ödeme servisinde beklenmeyen bir hata oluştu',
        occurredAt: new Date().toISOString(),
      });
    }
  }

  private async requestMockPayment(
    payload: PaymentRequest,
  ): Promise<MockPaymentResult> {
    try {
      return await firstValueFrom(
        this.mockPaymentClient.send<MockPaymentResult, Record<string, unknown>>(
          'mock-payment.charge',
          {
            orderId: payload.orderId,
            amount: payload.totalAmount,
            currency: payload.currency,
            paymentMethodToken: payload.paymentMethodToken,
            forceFailure: payload.forceFailure,
          },
        ),
      );
    } catch {
      return {
        success: false,
        reason: 'Mock ödeme servisine ulaşılamadı',
      };
    }
  }
}
