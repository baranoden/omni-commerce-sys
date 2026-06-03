import { Module } from '@nestjs/common';
import { MockStockController } from './mock-stock.controller';
import { MockStockService } from './mock-stock.service';

@Module({
  controllers: [MockStockController],
  providers: [MockStockService],
})
export class MockStockModule {}
