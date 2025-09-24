import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { Types } from 'mongoose'

import { UserRole, UserStatus } from '@users/schemas/user.schema'
export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsEmail()
  email: string

  @IsNotEmpty()
  @MinLength(6)
  password: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[] = [UserRole.Customer]

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus = UserStatus.Active

  @IsOptional()
  defaultAddressId?: Types.ObjectId

  @IsOptional()
  @IsString()
  avatarUrl?: string
}
