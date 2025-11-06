// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ProductsModule } from '../products/products.module';
import { SubcategoriesModule } from '../subcategories/subcategories.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [ProductsModule, SubcategoriesModule, BrandsModule], // Thêm các module cần thiết
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
