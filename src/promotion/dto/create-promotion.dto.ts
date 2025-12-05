import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
  IsDateString,
  Min,
} from 'class-validator';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType)
  @IsNotEmpty()
  discount_type: DiscountType;

  @IsNumber()
  @IsPositive()
  @Min(0)
  discount_value: number;
  
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsPositive()
  @Min(0)
  discount_amount: number;

  @IsNotEmpty()
  start_date: Date;

  @IsNotEmpty()
  end_date: Date;

  @IsNotEmpty()
  status: boolean;
}
