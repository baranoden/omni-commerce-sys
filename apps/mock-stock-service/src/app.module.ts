import { Module } from '@nestjs/common';
import { MockStockModule } from './mock-stock/mock-stock.module';

@Module({
  imports: [MockStockModule],
})
export class AppModule {}
