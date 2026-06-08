import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getKafkaBrokers, getKafkaClientId } from '../messaging/kafka.config';
import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.register([
      {
        name: 'PRODUCTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PRODUCTS_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.PRODUCTS_SERVICE_TCP_PORT ?? 4006),
        },
      },
      {
        name: 'ORDER_EVENTS_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: getKafkaClientId('order-service-producer'),
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId:
              process.env.ORDER_EVENTS_KAFKA_GROUP_ID ??
              'omni-commerce-order-service-producer',
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
