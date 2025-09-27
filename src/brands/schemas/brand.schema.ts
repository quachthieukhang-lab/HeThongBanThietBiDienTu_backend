import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ collection: 'brands', timestamps: true })
export class Brand {
  @Prop({ required: true, trim: true }) name!: string
  @Prop({ required: true, trim: true, lowercase: true, unique: true }) slug!: string
  @Prop() logoUrl?: string
  @Prop() country?: string
}
export const BrandSchema = SchemaFactory.createForClass(Brand)
BrandSchema.index({ slug: 1 }, { unique: true })
