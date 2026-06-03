import { Controller, HttpException, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('order.create')
  async create(
    @Payload() payload: CreateOrderDto & { createdByUserId: number },
  ) {
    try {
      return await this.ordersService.create(payload);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('order.findMine')
  async findMine(@Payload() payload: { userId: number }) {
    try {
      return await this.ordersService.findMine(payload.userId);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('order.findOne')
  async findOne(@Payload() payload: { id: number; userId: number }) {
    try {
      return await this.ordersService.findOne(payload.id, payload.userId);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('order.pay')
  async pay(
    @Payload()
    payload: {
      id: number;
      userId: number;
      simulatePaymentFailure?: boolean;
      simulateStockFailure?: boolean;
    },
  ) {
    try {
      return await this.ordersService.pay(payload.id, payload.userId, payload);
    } catch (error) {
      throw this.toRpcException(error);
    }
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
      message: 'Sipariş servisinde beklenmeyen bir hata oluştu',
    });
  }
}
