import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class RemoveItemDto {
  @IsOptional()
  @IsString()
  sessionId?: string

  @IsNotEmpty()
  @IsString()
  productId: string

  @IsOptional()
  @IsString()
  variantId?: string
}
