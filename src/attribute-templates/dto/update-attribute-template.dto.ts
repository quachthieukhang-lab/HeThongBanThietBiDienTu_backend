// src/attribute-templates/dto/update-attribute-template.dto.ts
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { AttributeDefDto } from './attribute-def.dto'

export class UpdateAttributeTemplateDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttributeDefDto)
  attributes?: AttributeDefDto[]

  @IsOptional()
  meta?: Record<string, unknown>
}
