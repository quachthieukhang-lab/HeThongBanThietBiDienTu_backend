import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AddressesModule } from './addresses/addresses.module';
import { ProductsModule } from './products/products.module';
import { ProductVariantsModule } from './product_variants/product_variants.module';
import { AttributesModule } from './attributes/attributes.module';
import { CategoriesModule } from './categories/categories.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { OrdersModule } from './orders/orders.module';
import { BrandsModule } from './brands/brands.module';
         

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/HTBTBDT'),
    UsersModule,
    AddressesModule,
    ProductsModule,
    ProductVariantsModule,
    AttributesModule,
    CategoriesModule,
    SubcategoriesModule,
    OrdersModule,
    BrandsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}