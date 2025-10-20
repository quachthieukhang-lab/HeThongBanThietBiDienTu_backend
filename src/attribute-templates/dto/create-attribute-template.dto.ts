// src/attribute-templates/dto/create-attribute-template.dto.ts
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { AttributeDefDto } from './attribute-def.dto'

export class CreateAttributeTemplateDto {
  @IsMongoId()
  subcategoryId!: string

  @IsNotEmpty()
  @IsString()
  name: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  version?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttributeDefDto)
  attributes!: AttributeDefDto[]

  @IsOptional()
  meta?: Record<string, unknown>
}
