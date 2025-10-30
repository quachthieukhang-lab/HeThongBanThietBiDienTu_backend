import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export enum OrderStatus {
  Pending = 'pending', // Chờ xác nhận thanh toán
  Processing = 'processing', // Đã xác nhận, đang xử lý
  Shipped = 'shipped', // Đang giao hàng
  Delivered = 'delivered', // Đã giao thành công
  Cancelled = 'cancelled', // Đã hủy
  Refunded = 'refunded', // Đã hoàn tiền
}

export enum PaymentMethod {
  COD = 'cod', // Trả tiền khi nhận hàng
  CreditCard = 'credit_card', // Thẻ tín dụng
  PayPal = 'paypal', // PayPal
}

// Snapshot của một item trong giỏ hàng tại thời điểm đặt hàng
@Schema({ _id: false })
class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
  variantId?: Types.ObjectId

  @Prop({ required: true })
  name: string

  @Prop()
  thumbnail?: string

  @Prop({ required: true })
  price: number

  @Prop({ required: true })
  quantity: number

  @Prop({ type: Object })
  facets?: Record<string, any>
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem)

// Snapshot của địa chỉ giao hàng
@Schema({ _id: false })
class ShippingAddress {
  @Prop({ required: true })
  fullName: string

  @Prop({ required: true })
  phone: string

  @Prop({ required: true })
  line1: string

  @Prop()
  line2?: string

  @Prop()
  ward?: string

  @Prop()
  district?: string

  @Prop({ required: true })
  city: string

  @Prop()
  province?: string

  @Prop({ required: true, default: 'VN' })
  country: string
}
const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress)

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId

  @Prop({ required: true, unique: true, index: true })
  code: string // Mã đơn hàng, ví dụ: 'DH-123456'

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[]

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress

  @Prop({ required: true })
  subTotal: number // Tổng tiền hàng

  @Prop({ default: 0 })
  shippingFee: number // Phí vận chuyển

  @Prop({ required: true })
  totalPrice: number // Tổng cộng

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.Pending, index: true })
  status: OrderStatus

  @Prop()
  notes?: string
}

export const OrderSchema = SchemaFactory.createForClass(Order)

