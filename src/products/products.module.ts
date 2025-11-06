import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'
import { Product, ProductSchema } from './schemas/product.schema'
import {
  ProductVariant,
  ProductVariantSchema,
} from '../product_variants/schemas/product-variant.schema'
import { UploadModule } from '../upload/upload.module'

// Tối thiểu hóa model AttributeTemplate để query
import { Schema as MSchema } from 'mongoose'
const AttributeTemplateSchema = new MSchema(
  {
    subcategoryId: { type: MSchema.Types.ObjectId, ref: 'Subcategory', required: true },
    version: { type: Number, required: true },
    isActive: { type: Boolean, default: false },
    attributes: { type: Array, default: [] },
  },
  { collection: 'attribute_templates' },
)

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: 'AttributeTemplate', schema: AttributeTemplateSchema },
    ]),
    UploadModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
