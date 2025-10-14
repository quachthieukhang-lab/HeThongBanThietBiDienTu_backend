import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator'

export class SetQtyDto {
  @IsOptional()
  @IsString()
  sessionId?: string

  @IsNotEmpty()
  @IsString()
  productId: string

  @IsOptional()
  @IsString()
  variantId?: string

  @IsInt()
  @Min(0)
  quantity: number // 0 => remove
}
