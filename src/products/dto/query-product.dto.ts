import { IsOptional, IsString, IsInt, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

export class QueryProductsDto {
  @IsOptional() @Type(() => Number) @IsInt()
  page: number = 1

  @IsOptional() @Type(() => Number) @IsInt()
  limit: number = 20

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

  @IsOptional()
  @IsIn(['name', '-createdAt', 'priceFrom', 'priceTo'])
  sort?: 'name' | '-createdAt' | 'priceFrom' | 'priceTo' = '-createdAt'
}
