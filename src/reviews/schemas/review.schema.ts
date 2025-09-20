import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ReviewStatus {
  Published = 'published',
  Pending = 'pending',
  Rejected = 'rejected',
  Deleted = 'deleted',
}

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  title?: string;

  @Prop()
  content?: string;

  @Prop([String])
  pros?: string[];

  @Prop([String])
  cons?: string[];

  @Prop([String])
  images?: string[];

  @Prop({ default: false })
  verifiedPurchase: boolean;

  @Prop({
    type: String,
    enum: ReviewStatus,
    default: ReviewStatus.Pending,
  })
  status: ReviewStatus;

  @Prop()
  deletedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, status: 1, createdAt: -1 });
ReviewSchema.index(
  { productId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: 'deleted' } } },
);
