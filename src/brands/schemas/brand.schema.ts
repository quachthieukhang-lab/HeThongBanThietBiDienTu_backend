import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class Brand extends Document {
  @Prop({ required: true, trim: true })
  name!: string

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  slug!: string

  @Prop()
  logoUrl?: string

  @Prop()
  country?: string

  @Prop()
  description?: string

  @Prop()
  websiteUrl?: string
}
export const BrandSchema = SchemaFactory.createForClass(Brand)
BrandSchema.index({ name: 1 })
BrandSchema.index({ slug: 1 }, { unique: true })
