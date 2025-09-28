import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class QueryBrandDto {
  @IsOptional()
  @IsString()
  q?: string // search theo name (regex, i)

  @IsOptional()
  @IsString()
  slug?: string

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
