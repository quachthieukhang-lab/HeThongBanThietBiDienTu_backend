// src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsEmail()
  email: string

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6)
  password: string

  @IsOptional()
  @IsString()
  phone?: string
}
