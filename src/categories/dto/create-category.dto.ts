import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  slug?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsNumber()
  sortOrder?: number

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true

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
