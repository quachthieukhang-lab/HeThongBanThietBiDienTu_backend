import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ProductVariant extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;
  
  @Prop({ required: true, unique: true })
  sku: string;

  @Prop()
  barcode?: string;

  @Prop({ type: Object, required: true })
  attributes: {
    Color?: string;
    Storage?: number;
    RAM?: number;
    [key: string]: any; // mở rộng linh hoạt
  };

  @Prop({ type: Object, default: {} })
  facets: {
    color?: string;
    storage?: number;
    ram?: number;
  };

  @Prop({ required: true })
  price: number;

  @Prop()
  compareAtPrice?: number;

  @Prop({ required: true, default: 0 })
  stock: number;

  @Prop([String])
  images?: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

// Indexes gợi ý
ProductVariantSchema.index({ productId: 1, isActive: 1 });
ProductVariantSchema.index({ 'facets.storage': 1 });
ProductVariantSchema.index({ 'facets.ram': 1 });
ProductVariantSchema.index({ 'facets.color': 1 });
