import { Controller, HttpException, HttpStatus } from '@nestjs/common';
import {
  EventPattern,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('payment.process')
  async process(
    @Payload()
    payload: {
      orderId: number;
      userId: number;
      totalAmount: number;
      currency: string;
      paymentMethodToken: string;
      forceFailure?: boolean;
    },
  ) {
    try {
      return await this.paymentsService.processPayment(payload);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @EventPattern('stock.reserved')
  async handleStockReserved(
    @Payload()
    payload: {
      orderId: number;
      sagaId: string;
      createdByUserId: number;
      paymentMethodToken: string;
      currency: string;
      totalAmount: number;
      simulatePaymentFailure?: boolean;
      items: Array<{
        productId: number;
        quantity: number;
      }>;
    },
  ) {
    await this.paymentsService.processReservedStock(payload);
  }

  private toRpcException(error: unknown) {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' &&
              response !== null &&
              'message' in response
            ? response.message
            : error.message;

      return new RpcException({
        statusCode: error.getStatus(),
        message,
      });
    }

    return new RpcException({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ödeme servisinde beklenmeyen bir hata oluştu',
    });
  }
}
