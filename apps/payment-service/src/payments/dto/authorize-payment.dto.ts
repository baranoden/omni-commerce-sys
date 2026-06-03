import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AuthorizePaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  currency: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  paymentMethodToken: string;
}
