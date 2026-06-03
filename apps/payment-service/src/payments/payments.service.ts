import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';

interface PaymentRequest {
  orderId: number;
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

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @Inject('MOCK_PAYMENT_SERVICE')
    private readonly mockPaymentClient: ClientProxy,
  ) {}

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
      sagaId: `payment-${payload.orderId}`,
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
