import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
export class CreateServicePackageDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0) price: number;
  @IsString() @IsOptional() duration?: string;
  @IsEnum(['install','warranty','addon','other'] as const) @IsOptional() type?: any;
  @IsBoolean() @IsOptional() isActive?: boolean = true;
}