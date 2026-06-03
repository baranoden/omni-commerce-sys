import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
