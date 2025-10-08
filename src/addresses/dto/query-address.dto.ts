import { IsNumber, IsOptional, Min, Max, IsString, IsNotEmpty } from 'class-validator'
import { Type } from 'class-transformer'

export class QueryAddressDto {
  @IsNotEmpty()
  @IsString()
  userId?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number = 20
}
