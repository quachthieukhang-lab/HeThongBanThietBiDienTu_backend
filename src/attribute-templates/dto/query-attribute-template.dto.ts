// src/attribute-templates/dto/query-attribute-template.dto.ts
import { IsBoolean, IsMongoId, IsNumber, IsOptional, Min, Max } from 'class-validator'

export class QueryAttributeTemplateDto {
  @IsOptional()
  @IsMongoId()
  subcategoryId?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number
}
