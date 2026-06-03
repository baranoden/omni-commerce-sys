import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateOrderDto } from './dto/create-order.dto';
import { PayOrderDto } from './dto/pay-order.dto';
import { ORDERS_SERVICE } from './orders.constants';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDERS_SERVICE)
    private readonly ordersClient: ClientProxy,
  ) {}

  create(createOrderDto: CreateOrderDto, userId: number) {
    return this.send('order.create', {
      ...createOrderDto,
      createdByUserId: userId,
    });
  }

  findMine(userId: number) {
    return this.send('order.findMine', { userId });
  }

  findOne(id: number, userId: number) {
    return this.send('order.findOne', { id, userId });
  }

  pay(id: number, body: PayOrderDto, userId: number) {
    return this.send('order.pay', {
      id,
      userId,
      ...body,
    });
  }

  private async send<TResult, TPayload>(
    pattern: string,
    payload: TPayload,
  ): Promise<TResult> {
    try {
      return await firstValueFrom(
        this.ordersClient.send<TResult, TPayload>(pattern, payload),
      );
    } catch (error) {
      throw this.mapRpcError(error);
    }
  }

  private mapRpcError(error: unknown) {
    if (typeof error === 'object' && error !== null) {
      const rpcError = error as {
        statusCode?: number;
        message?: string | string[];
      };

      const message = Array.isArray(rpcError.message)
        ? (rpcError.message[0] ?? 'Sipariş servisi hatası oluştu')
        : (rpcError.message ?? 'Sipariş servisi hatası oluştu');

      return new HttpException(
        message,
        rpcError.statusCode ?? HttpStatus.BAD_GATEWAY,
      );
    }

    return new HttpException(
      'Sipariş servisine ulaşılamıyor',
      HttpStatus.BAD_GATEWAY,
    );
  }
}
