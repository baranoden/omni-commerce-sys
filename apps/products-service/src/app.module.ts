import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PRODUCTS_DB_HOST ?? 'localhost',
      port: Number(process.env.PRODUCTS_DB_PORT ?? 5432),
      username: process.env.PRODUCTS_DB_USERNAME ?? 'postgres',
      password: process.env.PRODUCTS_DB_PASSWORD ?? '123456',
      database: process.env.PRODUCTS_DB_NAME ?? 'products_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    ProductsModule,
  ],
})
export class AppModule {}
