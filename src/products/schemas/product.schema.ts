import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, trim: true })
  name: string

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Subcategory', required: true })
  subcategoryId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'AttributeTemplate', required: true })
  templateId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true, index: true })
  brandId: Types.ObjectId

  @Prop({ default: 1 })
  templateVersion: number

  // Hybrid
  @Prop({ type: Object, default: {} })
  specs: Record<string, any>

  @Prop({ type: Object, default: {} })
  facets: Record<string, any>

  @Prop({ type: Object, default: {} })
  variantFacetSummary: Record<string, any>

  @Prop()
  thumbnail?: string

  @Prop([String])
  images?: string[]

  @Prop({ required: true, default: 0 })
  priceFrom: number

  @Prop({ required: true, default: 0 })
  priceTo: number

  @Prop({ default: true })
  isPublished: boolean
}

export const ProductSchema = SchemaFactory.createForClass(Product)

ProductSchema.index({ categoryId: 1 })
ProductSchema.index({ subcategoryId: 1 })
ProductSchema.index({ 'facets.brand': 1 })
