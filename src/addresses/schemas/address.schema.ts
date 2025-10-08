import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ timestamps: true })
export class Address extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId

  @Prop({ required: true, trim: true })
  fullName: string

  @Prop({ required: true, trim: true })
  phone: string

  @Prop({ required: true, trim: true })
  line1: string

  @Prop({ trim: true })
  line2?: string

  @Prop({ trim: true })
  ward?: string

  @Prop({ trim: true })
  district?: string

  @Prop({ required: true, trim: true })
  city: string

  @Prop({ trim: true })
  province?: string

  @Prop({ required: true, trim: true, default: 'VN' })
  country: string

  @Prop({ trim: true })
  postalCode?: string

  @Prop({ default: false })
  isDefault: boolean
}

export const AddressSchema = SchemaFactory.createForClass(Address)

AddressSchema.index({ userId: 1, isDefault: 1 })
