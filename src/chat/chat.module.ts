// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from '../products/products.module';
import { ChatHistoryModule } from '@chat-history/chat-history.module';
@Module({
  imports: [
    ConfigModule,
    ProductsModule,
    ChatHistoryModule, // Import ChatHistoryModule để sử dụng ChatHistoryService
  ], // Thêm ProductsModule để ChatService có thể dùng ProductsService
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule { }
