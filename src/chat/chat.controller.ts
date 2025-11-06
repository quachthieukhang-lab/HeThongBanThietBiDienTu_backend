// src/chat/chat.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

class ChatMessageDto {
  message: string;
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async handleMessage(@Body() chatMessageDto: ChatMessageDto) {
    const reply = await this.chatService.generateResponse(chatMessageDto.message);
    return { reply };
  }
}
