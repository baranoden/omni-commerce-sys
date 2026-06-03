import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class RefundPaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
