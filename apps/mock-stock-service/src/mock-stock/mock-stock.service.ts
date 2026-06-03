import { Injectable } from '@nestjs/common';

@Injectable()
export class MockStockService {
  async check(payload: {
    orderId: number;
    items: Array<{
      productId: number;
      quantity: number;
    }>;
    forceFailure?: boolean;
  }) {
    await new Promise((resolve) => setTimeout(resolve, 150));

    const hasUnavailableItem = payload.items.some(
      (item) => item.productId === 404 || item.quantity > 10,
    );

    if (payload.forceFailure === true || hasUnavailableItem) {
      return {
        success: false,
        reason: 'Stok yok',
      };
    }

    return {
      success: true,
      reservedAt: new Date().toISOString(),
    };
  }
}
