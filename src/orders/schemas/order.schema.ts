import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

export enum OrderStatus {
  Pending = 'pending',
  Processing = 'processing', 
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

export enum PaymentMethod {
  COD = 'cod',
  CreditCard = 'credit_card',
  PayPal = 'paypal',
}

// Sub-schema cho Service Package
@Schema({ _id: false })
class ServicePackage {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  description?: string;

  @Prop()
  duration?: string;
}

const ServicePackageSchema = SchemaFactory.createForClass(ServicePackage);

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

  // THÊM FIELD SERVICE PACKAGES VÀO ĐÂY
  @Prop({ type: [ServicePackageSchema], default: [] })
  servicePackages?: ServicePackage[];

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
  code: string

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[]

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress

  @Prop({ required: true })
  subTotal: number

  @Prop({ default: 0 })
  shippingFee: number

  @Prop({ required: true })
  totalPrice: number

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.Pending, index: true })
  status: OrderStatus

  @Prop()
  notes?: string
  
  // Có thể thêm promotion fields nếu cần
  @Prop()
  promoCode?: string
  
  @Prop({ type: Object })
  promotion?: {
    code: string;
    discountAmount: number;
    discountType: string;
  };
}

export const OrderSchema = SchemaFactory.createForClass(Order)