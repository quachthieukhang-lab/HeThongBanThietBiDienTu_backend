import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductVariantsService } from './product_variants.service';
import { ProductVariantsController } from './product_variants.controller';
import { ProductVariant, ProductVariantSchema } from './schemas/product-variant.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Schema as MSchema } from 'mongoose';

// Tối thiểu hoá model AttributeTemplate để query
const AttributeTemplateSchema = new MSchema({
  subcategoryId: { type: MSchema.Types.ObjectId, ref: 'Subcategory', required: true },
  version: { type: Number, required: true },
  isActive: { type: Boolean, default: false },
  attributes: { type: Array, default: [] },
}, { collection: 'attribute_templates' });

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: Product.name, schema: ProductSchema },
      { name: 'AttributeTemplate', schema: AttributeTemplateSchema },
    ]),
  ],
  controllers: [ProductVariantsController],
  providers: [ProductVariantsService],
  exports: [ProductVariantsService],
})
export class ProductVariantsModule { }
