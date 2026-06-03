import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MockStockService } from './mock-stock.service';

@Controller()
export class MockStockController {
  constructor(private readonly mockStockService: MockStockService) {}

  @MessagePattern('stock.check')
  check(
    @Payload()
    payload: {
      orderId: number;
      items: Array<{
        productId: number;
        quantity: number;
      }>;
      forceFailure?: boolean;
    },
  ) {
    return this.mockStockService.check(payload);
  }
}
