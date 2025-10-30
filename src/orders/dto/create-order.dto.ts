import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator'
import { PaymentMethod } from '../schemas/order.schema'

export class CreateOrderDto {
  @IsMongoId()
  addressId: string

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod

  @IsOptional()
  @IsString()
  notes?: string
}
