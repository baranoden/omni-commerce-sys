import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getKafkaBrokers, getKafkaClientId } from '../messaging/kafka.config';
import { Payment } from './payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ClientsModule.register([
      {
        name: 'MOCK_PAYMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MOCK_PAYMENT_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.MOCK_PAYMENT_SERVICE_TCP_PORT ?? 4005),
        },
      },
      {
        name: 'PAYMENT_EVENTS_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: getKafkaClientId('payment-service-producer'),
            brokers: getKafkaBrokers(),
          },
          consumer: {
            groupId:
              process.env.PAYMENT_EVENTS_KAFKA_GROUP_ID ??
              'omni-commerce-payment-service-producer',
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
