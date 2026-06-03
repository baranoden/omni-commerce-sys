import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MockPaymentService } from './mock-payment.service';

@Controller()
export class MockPaymentController {
  constructor(private readonly mockPaymentService: MockPaymentService) {}

  @MessagePattern('mock-payment.charge')
  charge(
    @Payload()
    payload: {
      orderId: number;
      amount: number;
      currency: string;
      paymentMethodToken: string;
      forceFailure?: boolean;
    },
  ) {
    return this.mockPaymentService.charge(payload);
  }
}
