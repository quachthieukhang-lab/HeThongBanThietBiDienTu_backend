import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UsersModule } from './users/users.module'
import { AddressesModule } from './addresses/addresses.module'
import { ProductsModule } from './products/products.module'
import { ProductVariantsModule } from './product_variants/product_variants.module'
import { CategoriesModule } from './categories/categories.module'
import { SubcategoriesModule } from './subcategories/subcategories.module'
import { OrdersModule } from './orders/orders.module'
import { BrandsModule } from './brands/brands.module'
import { AttributeTemplatesModule } from './attribute-templates/attribute-templates.module'
import { CartsModule } from './carts/carts.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AddressesModule,
    ProductsModule,
    ProductVariantsModule,
    CategoriesModule,
    SubcategoriesModule,
    OrdersModule,
    BrandsModule,
    AttributeTemplatesModule,
    CartsModule,
    AuthModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }