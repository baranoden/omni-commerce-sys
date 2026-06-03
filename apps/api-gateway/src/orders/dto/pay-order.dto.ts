import { IsBoolean, IsOptional } from 'class-validator';

export class PayOrderDto {
  @IsOptional()
  @IsBoolean()
  simulatePaymentFailure?: boolean;

  @IsOptional()
  @IsBoolean()
  simulateStockFailure?: boolean;
}
