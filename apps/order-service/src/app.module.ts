import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.ORDER_DB_HOST ?? 'localhost',
      port: Number(process.env.ORDER_DB_PORT ?? 5432),
      username: process.env.ORDER_DB_USERNAME ?? 'postgres',
      password: process.env.ORDER_DB_PASSWORD ?? '123456',
      database: process.env.ORDER_DB_NAME ?? 'order_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    OrdersModule,
  ],
})
export class AppModule {}
