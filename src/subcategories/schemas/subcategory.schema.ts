import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ timestamps: true })
export class Subcategory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId

  @Prop({ required: true, trim: true })
  name: string

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string

  @Prop({ type: Types.ObjectId, ref: 'AttributeTemplate' })
  attributeTemplateId?: Types.ObjectId

  @Prop({ default: true })
  sortOrder?: number

  @Prop()
  icon?: string

  @Prop()
  description?: string

  @Prop()
  image?: string

  @Prop({ default: true })
  isActive: boolean

  @Prop()
  banner?: string

  @Prop()
  metaTitle?: string

  @Prop()
  metaDescription?: string

  @Prop()
  path?: string
}

export const SubcategorySchema = SchemaFactory.createForClass(Subcategory)

SubcategorySchema.index({ categoryId: 1, slug: 1 }, { unique: true })

SubcategorySchema.index({ categoryId: 1, isActive: 1, sortOrder: 1 })
