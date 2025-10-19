import { IsOptional, IsString, IsInt } from 'class-validator'

export class QueryProductsDto {
  @IsOptional() @IsInt()
  page?: number

  @IsOptional() @IsInt()
  limit?: number

  @IsOptional() @IsString()
  search?: string

  @IsOptional() @IsString()
  categoryId?: string

  @IsOptional() @IsString()
  subcategoryId?: string

  @IsOptional() @IsString()
  brandId?: string

  @IsOptional() @IsString()
  isPublished?: string // 'true' | 'false'

  @IsOptional() @IsString()
  sort?: 'name' | '-createdAt' | 'priceFrom' | 'priceTo'
}
