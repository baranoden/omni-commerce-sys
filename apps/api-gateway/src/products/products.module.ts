import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PRODUCTS_SERVICE } from './products.constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PRODUCTS_SERVICE,
        transport: Transport.TCP,
        options: {
          host: process.env.PRODUCTS_SERVICE_HOST ?? '127.0.0.1',
          port: Number(process.env.PRODUCTS_SERVICE_TCP_PORT ?? 4001),
        },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
