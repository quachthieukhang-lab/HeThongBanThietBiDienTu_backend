// src/attribute-templates/dto/attribute-def.dto.ts
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { AttrType } from '../schemas/attribute-template.schema'

export class AttributeDefDto {
  @IsString()
  @IsNotEmpty()
  key!: string

  @IsString()
  @IsNotEmpty()
  label!: string

  @IsEnum(AttrType)
  type!: AttrType

  @IsOptional()
  @IsString()
  unit?: string

  @IsOptional()
  @IsNumber()
  min?: number

  @IsOptional()
  @IsNumber()
  max?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  step?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  decimals?: number

  // Cho phép string | number
  @IsOptional()
  @IsArray()
  @Type(() => Object)
  options?: Array<string | number>

  @IsOptional()
  @IsBoolean()
  required?: boolean

  @IsOptional()
  @IsBoolean()
  filterable?: boolean

  @IsOptional()
  @IsBoolean()
  sortable?: boolean

  @IsOptional()
  @IsBoolean()
  searchable?: boolean

  @IsOptional()
  @IsString()
  group?: string

  @IsOptional()
  @IsNumber()
  order?: number
}
