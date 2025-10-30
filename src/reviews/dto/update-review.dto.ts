import { IsEnum, IsOptional } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { CreateReviewDto } from './create-review.dto'
import { ReviewStatus } from '../schemas/review.schema'

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
  // Chỉ Admin/Staff mới được cập nhật status
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus
}
