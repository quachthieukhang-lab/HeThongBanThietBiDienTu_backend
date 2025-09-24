import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true, trim: true })
  name: string

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string

  @Prop()
  icon?: string

  @Prop()
  sortOrder?: number

  @Prop()
  description?: string

  @Prop({ default: true })
  isActive: boolean

  @Prop()
  image?: string

  @Prop()
  banner?: string

  @Prop()
  metaTitle?: string

  @Prop()
  metaDescription?: string

  @Prop()
  path?: string
}

export const CategorySchema = SchemaFactory.createForClass(Category)

CategorySchema.index({ isActive: 1, sortOrder: 1 });