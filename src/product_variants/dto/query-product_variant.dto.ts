import { IsOptional, IsString, IsInt } from 'class-validator'

export class QueryVariantsDto {
  @IsOptional() @IsInt()
  page?: number

  @IsOptional() @IsInt()
  limit?: number

  @IsOptional() @IsString()
  productId?: string

  @IsOptional() @IsString()
  search?: string

  @IsOptional() @IsString()
  isActive?: 'true' | 'false'

  @IsOptional() @IsString()
  sort?: '-createdAt' | 'price' | '-price' | 'sku'
}
