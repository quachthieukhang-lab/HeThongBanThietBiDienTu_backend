// src/categories/dto/create-subcategory.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsInt, Min, IsMongoId } from 'class-validator'
export class CreateSubcategoryDto {
  @IsNotEmpty()
  @IsString()
  categoryId: string // ObjectId string

  @IsNotEmpty()
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  slug?: string

  @IsOptional()
  @IsMongoId()
  attributeTemplateId?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsString()
  image?: string

  @IsOptional()
  @IsString()
  banner?: string

  @IsOptional()
  @IsString()
  metaTitle?: string

  @IsOptional()
  @IsString()
  metaDescription?: string

  @IsOptional()
  @IsString()
  path?: string
}
