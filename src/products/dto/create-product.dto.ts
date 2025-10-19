import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray } from 'class-validator'

export class CreateProductDto {
  @IsNotEmpty() @IsString()
  name: string

  @IsOptional() @IsString()
  slug?: string // nếu không truyền, BE sẽ slugify từ name

  @IsNotEmpty() @IsString()
  categoryId: string

  @IsNotEmpty() @IsString()
  subcategoryId: string

  @IsOptional() @IsString()
  brandId?: string

  @IsOptional()
  specs?: Record<string, any>

  @IsOptional() @IsArray()
  images?: string[]

  @IsOptional() @IsString()
  thumbnail?: string

  @IsOptional() @IsBoolean()
  isPublished?: boolean
}
