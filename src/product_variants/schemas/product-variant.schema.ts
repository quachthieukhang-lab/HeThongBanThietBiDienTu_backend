import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ collection: 'product_variants', timestamps: true })
export class ProductVariant extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId

  @Prop({ trim: true })
  sku?: string

  @Prop({ trim: true })
  barcode?: string

  // Thuộc tính đầy đủ của variant (display/detail)
  @Prop({ type: Object, required: true })
  attributes: Record<string, any>

  // Subset dùng filter/search (sinh từ template.filterable)
  @Prop({ type: Object, default: {} })
  facets?: Record<string, any>

  @Prop({ required: true, min: 0 })
  price: number

  @Prop({ min: 0 })
  compareAtPrice?: number

  @Prop({ required: true, default: 0, min: 0 })
  stock: number

  @Prop([String])
  images?: string[]

  @Prop({ default: true })
  isActive: boolean
}
export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant)

ProductVariantSchema.index({ productId: 1, isActive: 1 })
ProductVariantSchema.index({ sku: 1 }, { sparse: true })
ProductVariantSchema.index({ barcode: 1 }, { sparse: true })
