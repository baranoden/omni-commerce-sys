import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { getKafkaBrokers, getKafkaClientId } from '../messaging/kafka.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    ClientsModule.register([
      {
        name: 'PRODUCT_EVENTS_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: getKafkaClientId('products-service-producer'),
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId:
              process.env.PRODUCT_EVENTS_KAFKA_GROUP_ID ??
              'omni-commerce-products-service-producer',
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
