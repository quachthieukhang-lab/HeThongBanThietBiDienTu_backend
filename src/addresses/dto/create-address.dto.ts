import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator'

export class CreateAddressDto {
  @IsNotEmpty() @IsString()
  userId: string // ObjectId string (nếu có auth thì lấy từ req.user.id)

  @IsNotEmpty() @IsString()
  fullName: string

  @IsNotEmpty() @IsString()
  phone: string

  @IsNotEmpty() @IsString()
  line1: string

  @IsOptional() @IsString()
  line2?: string

  @IsOptional() @IsString()
  ward?: string

  @IsOptional() @IsString()
  district?: string

  @IsNotEmpty() @IsString()
  city: string

  @IsOptional() @IsString()
  province?: string

  @IsOptional() @IsString()
  country?: string // default 'VN' ở schema

  @IsOptional() @IsString()
  postalCode?: string

  @IsOptional() @IsBoolean()
  isDefault?: boolean // nếu true → set mặc định và bỏ mặc định của các địa chỉ khác cùng user
}
