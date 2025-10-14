import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
  variantId?: Types.ObjectId

  @Prop({ required: true, trim: true })
  name: string

  @Prop()
  thumbnail?: string

  @Prop({ required: true, min: 0 })
  price: number

  @Prop({ required: true, min: 1 })
  quantity: number

  @Prop({ type: Object })
  facets?: Record<string, any>
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem)

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId

  @Prop()
  sessionId?: string // cho guest

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[]

  @Prop({ required: true, default: 0 })
  totalQuantity: number

  @Prop({ required: true, default: 0 })
  totalPrice: number

  @Prop({ enum: ['active', 'ordered', 'abandoned'], default: 'active' })
  status: 'active' | 'ordered' | 'abandoned'
}

export const CartSchema = SchemaFactory.createForClass(Cart)

CartSchema.index({ userId: 1, status: 1 })
CartSchema.index({ sessionId: 1, status: 1 })
CartSchema.index({ 'items.productId': 1 })
CartSchema.index({ 'items.variantId': 1 })
