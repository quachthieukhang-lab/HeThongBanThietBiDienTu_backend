import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateReviewDto {
  @IsMongoId()
  productId: string

  @IsMongoId()
  orderId: string // Để xác thực người dùng đã mua sản phẩm

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsString()
  @IsNotEmpty()
  content: string
}