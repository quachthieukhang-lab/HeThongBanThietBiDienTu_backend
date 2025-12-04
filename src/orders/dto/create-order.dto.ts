import { IsEnum, IsMongoId, IsOptional, IsString, IsNumber } from 'class-validator';
import { PaymentMethod } from '../schemas/order.schema';

export class CreateOrderDto {
  @IsMongoId()
  addressId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  promoCode?: string; // tên mã giảm giá

  @IsOptional()
  @IsNumber()
  totalPrice?: number; // giá đã giảm
}
