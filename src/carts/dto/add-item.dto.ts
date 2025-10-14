import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator'

export class AddItemDto {
  @IsOptional()
  @IsString()
  // guest: gửi sessionId; user: có thể bỏ
  sessionId?: string

  @IsNotEmpty()
  @IsString()
  productId: string

  @IsOptional()
  @IsString()
  variantId?: string

  @IsInt()
  @Min(1)
  quantity: number
}
