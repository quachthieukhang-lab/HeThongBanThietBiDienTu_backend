import { Module } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { MongooseModule } from '@nestjs/mongoose'
import { Order, OrderSchema } from './schemas/order.schema'
import { Cart, CartSchema } from '@carts/schemas/cart.schema'
import { Address, AddressSchema } from '@addresses/schemas/address.schema'
import { ProductVariant, ProductVariantSchema } from '@product_variants/schemas/product-variant.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Address.name, schema: AddressSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
