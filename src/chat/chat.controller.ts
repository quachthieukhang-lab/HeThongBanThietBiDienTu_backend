// src/chat/chat.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Body() dto: CreateChatDto, @Req() req) {
    // req.user.sub là userId lấy từ token (do JwtStrategy xử lý)
    return this.chatService.chat(dto, req.user.sub);
  }
}