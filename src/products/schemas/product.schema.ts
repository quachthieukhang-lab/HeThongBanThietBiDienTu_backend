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

  @Prop({ type: Types.ObjectId, ref: 'Brand' })
  brandId?: Types.ObjectId

  // Mảng các gói dịch vụ đi kèm
  @Prop({ type: [{ type: Types.ObjectId, ref: 'ServicePackage' }] })
  servicePackageIds?: Types.ObjectId[]

  // Hybrid: specs chung cấp product (không dùng để filter)
  @Prop({ type: Object })
  specs?: Record<string, any>

  // Tham chiếu template để audit/version
  @Prop({ type: Types.ObjectId, ref: 'AttributeTemplate', required: true })
  templateId: Types.ObjectId

  @Prop({ required: true })
  templateVersion: number

  // Ảnh
  @Prop([String])
  images?: string[]

  @Prop()
  thumbnail?: string

  // Publish
  @Prop({ default: false })
  isPublished: boolean

  // Phạm vi giá lấy từ variants
  @Prop({ default: 0 })
  priceFrom: number

  @Prop({ default: 0 })
  priceTo: number

  @Prop({ type: Object }) // Adjust the type based on your data structure
  facets?: Record<string, any>
  // Tổng hợp facet từ variants (để FE render filter nhanh)
  @Prop({ type: Object, default: {} })
  variantFacetSummary?: Record<string, any>
}
export const ProductSchema = SchemaFactory.createForClass(Product)

ProductSchema.index({ subcategoryId: 1, isPublished: 1 })
ProductSchema.index({ slug: 1 }, { unique: true })
ProductSchema.index({ name: 1 })
