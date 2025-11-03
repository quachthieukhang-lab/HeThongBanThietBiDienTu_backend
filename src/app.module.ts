import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AppController } from './app.controller'
import { AppService } from './app.service'
// Module
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
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static'
import { ReviewsModule } from '@reviews/reviews.module'
//utilities
import { join } from 'path'
// Env
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    // Cấu hình để phục vụ file tĩnh từ thư mục 'public'
    ServeStaticModule.forRoot({
      // process.cwd() trả về thư mục gốc của project
      // join(process.cwd(), 'public') sẽ tạo ra đường dẫn tuyệt đối đến thư mục 'public'
      rootPath: join(process.cwd(), 'public'),
      serveStaticOptions: {
        index: false, // Ngăn không cho serve-static tìm index.html khi một file cụ thể không được tìm thấy
      },
      // Không cần prefix, request sẽ map trực tiếp
      // Ví dụ: request đến /uploads/image.jpg sẽ tìm file tại public/uploads/image.jpg
    }),
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
    ReviewsModule,
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