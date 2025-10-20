import { Module } from '@nestjs/common'
import { BrandsService } from './brands.service'
import { BrandsController } from './brands.controller'
import { Brand, BrandSchema } from './schemas/brand.schema'
import { MongooseModule } from '@nestjs/mongoose'
import { MulterModule } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'

const multerConfig = MulterModule.register({
  storage: memoryStorage(),
})

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
    // 💡 ĐÂY LÀ CHỖ CẦN THÊM CẤU HÌNH ĐÚNG:
    multerConfig,
  ],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}