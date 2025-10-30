import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export enum ReviewStatus {
  Pending = 'pending', // Chờ duyệt
  Approved = 'approved', // Đã duyệt
  Rejected = 'rejected', // Bị từ chối
}

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId

  @Prop({ required: true, min: 1, max: 5 })
  rating: number

  @Prop({ trim: true })
  title?: string

  @Prop({ required: true, trim: true })
  content: string

  @Prop({ type: [String] })
  images?: string[]

  @Prop({
    type: String,
    enum: ReviewStatus,
    default: ReviewStatus.Pending,
    index: true,
  })
  status: ReviewStatus

  // Thêm các trường khác nếu cần, ví dụ: likes, dislikes
}

export const ReviewSchema = SchemaFactory.createForClass(Review)

// Đảm bảo một user chỉ có thể review một sản phẩm một lần
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true })