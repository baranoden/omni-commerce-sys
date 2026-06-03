import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersController } from './orders.controller';
import { ORDERS_SERVICE } from './orders.constants';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ORDERS_SERVICE,
        transport: Transport.TCP,
        options: {
          host: process.env.ORDER_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.ORDER_SERVICE_TCP_PORT ?? 4003),
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
