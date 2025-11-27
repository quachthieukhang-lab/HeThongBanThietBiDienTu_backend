// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ConfigModule, ProductsModule], // Thêm ProductsModule để ChatService có thể dùng ProductsService
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}