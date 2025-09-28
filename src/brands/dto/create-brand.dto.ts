import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator'

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsNotEmpty()
  slug!: string // client/service phải cung cấp (schema đã lowercase & unique)

  @IsOptional()
  @IsUrl()
  logoUrl?: string

  @IsOptional()
  @IsString()
  country?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsUrl()
  websiteUrl?: string
}
