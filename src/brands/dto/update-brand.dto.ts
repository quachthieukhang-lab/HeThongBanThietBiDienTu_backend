import { IsOptional, IsString, IsUrl } from 'class-validator'

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  slug?: string // cho phép đổi nếu cần, vẫn bị ràng buộc unique ở DB

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
