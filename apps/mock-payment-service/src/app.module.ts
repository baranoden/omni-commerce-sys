import { Module } from '@nestjs/common';
import { MockPaymentModule } from './mock-payment/mock-payment.module';

@Module({
  imports: [MockPaymentModule],
})
export class AppModule {}
