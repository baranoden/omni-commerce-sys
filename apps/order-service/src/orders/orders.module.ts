import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.register([
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PAYMENT_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.PAYMENT_SERVICE_TCP_PORT ?? 4004),
        },
      },
      {
        name: 'MOCK_STOCK_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MOCK_STOCK_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.MOCK_STOCK_SERVICE_TCP_PORT ?? 4001),
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
