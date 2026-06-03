import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PAYMENT_DB_HOST ?? 'localhost',
      port: Number(process.env.PAYMENT_DB_PORT ?? 5432),
      username: process.env.PAYMENT_DB_USERNAME ?? 'postgres',
      password: process.env.PAYMENT_DB_PASSWORD ?? '123456',
      database: process.env.PAYMENT_DB_NAME ?? 'payment_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    PaymentsModule,
  ],
})
export class AppModule {}
