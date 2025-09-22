import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AttributeTemplate' })
  templateId: Types.ObjectId;

  @Prop({ default: 1 })
  templateVersion: number;

  // HYBRID
  @Prop({ type: Object, default: {} })
  specs: Record<string, any>; // hiển thị chi tiết (bảng thông số)

  @Prop({ type: Object, default: {} })
  facets: Record<string, any>; // chuẩn hóa để filter/sort

  // Tổng hợp từ các variants
  @Prop({ type: Object, default: {} })
  variantFacetSummary: {
    colors?: string[];
    storage_set?: number[];
    ram_set?: number[];
  };

  @Prop()
  thumbnail?: string;

  @Prop([String])
  images?: string[];

  // Giá tổng hợp (min/max từ variants)
  @Prop({ required: true, default: 0 })
  priceFrom: number;

  @Prop({ required: true, default: 0 })
  priceTo: number;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ default: 0 })
  ratingAvg: number;

  @Prop({ default: 0 })
  ratingCount: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes gợi ý
ProductSchema.index({ categoryId: 1, isPublished: 1 });
ProductSchema.index({ 'facets.brand': 1 });
ProductSchema.index({ 'facets.screen_size': 1 });
ProductSchema.index({ priceFrom: 1 });
