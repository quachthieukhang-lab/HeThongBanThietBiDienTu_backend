import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, IsInt } from 'class-validator'

export class CreateVariantDto {
  @IsNotEmpty() @IsString()
  productId: string

  @IsOptional() @IsString()
  sku?: string

  @IsOptional() @IsString()
  barcode?: string

  @IsNotEmpty()
  attributes: Record<string, any>  // validate theo template ở service

  @IsNumber() @Min(0)
  price: number

  @IsOptional() @IsNumber() @Min(0)
  compareAtPrice?: number

  @IsInt() @Min(0)
  stock: number

  @IsOptional()
  images?: string[]
}
