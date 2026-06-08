import { Controller, HttpException, HttpStatus } from '@nestjs/common';
import {
  EventPattern,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('product.create')
  async create(
    @Payload() payload: CreateProductDto & { createdByUserId: number },
  ) {
    try {
      return await this.productsService.create(payload);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.findAll')
  async findAll() {
    try {
      return await this.productsService.findAll();
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.findOne')
  async findOne(@Payload() payload: { id: number }) {
    try {
      return await this.productsService.findOne(payload.id);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.update')
  async update(@Payload() payload: { id: number } & UpdateProductDto) {
    try {
      const { id, ...updateProductDto } = payload;
      return await this.productsService.update(id, updateProductDto);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.remove')
  async remove(@Payload() payload: { id: number }) {
    try {
      return await this.productsService.remove(payload.id);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.stock.check')
  async checkStock(
    @Payload()
    payload: {
      items: Array<{ productId: number; quantity: number }>;
    },
  ) {
    try {
      return await this.productsService.checkStock(payload.items);
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.stock.decrement')
  async decrementStock(
    @Payload()
    payload: {
      orderId: number;
      items: Array<{ productId: number; quantity: number }>;
    },
  ) {
    try {
      return await this.productsService.decrementStock(
        payload.orderId,
        payload.items,
      );
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern('product.stock.increment')
  async incrementStock(
    @Payload()
    payload: {
      orderId: number;
      items: Array<{ productId: number; quantity: number }>;
    },
  ) {
    try {
      return await this.productsService.incrementStock(
        payload.orderId,
        payload.items,
      );
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @EventPattern('order.created')
  async handleOrderCreated(
    @Payload()
    payload: {
      orderId: number;
      sagaId: string;
      createdByUserId: number;
      currency: string;
      paymentMethodToken: string;
      items: Array<{ productId: number; quantity: number }>;
      simulatePaymentFailure?: boolean;
      simulateStockFailure?: boolean;
    },
  ) {
    await this.productsService.reserveStockForOrder(payload);
  }

  @EventPattern('payment.completed')
  async handlePaymentCompleted(
    @Payload()
    payload: {
      orderId: number;
      sagaId: string;
    },
  ) {
    await this.productsService.confirmReservation(payload);
  }

  @EventPattern('payment.failed')
  async handlePaymentFailed(
    @Payload()
    payload: {
      orderId: number;
      sagaId: string;
      reason: string;
    },
  ) {
    await this.productsService.releaseReservation(payload);
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
      message: 'Ürün servisinde beklenmeyen bir hata oluştu',
    });
  }
}
