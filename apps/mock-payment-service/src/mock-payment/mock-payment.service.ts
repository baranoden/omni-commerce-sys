import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class MockPaymentService {
  async charge(payload: {
    orderId: number;
    amount: number;
    currency: string;
    paymentMethodToken: string;
    forceFailure?: boolean;
  }) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const normalizedToken = payload.paymentMethodToken.toLowerCase();
    const shouldFail =
      payload.forceFailure === true ||
      normalizedToken.includes('fail') ||
      normalizedToken.includes('reject');

    if (shouldFail) {
      return {
        success: false,
        reason: 'Mock ödeme servisi işlemi reddetti',
      };
    }

    return {
      success: true,
      transactionId: randomUUID(),
      provider: 'mock-payment-service',
      amount: payload.amount,
      currency: payload.currency,
      occurredAt: new Date().toISOString(),
    };
  }
}
