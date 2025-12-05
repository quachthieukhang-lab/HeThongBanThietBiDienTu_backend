import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatHistoryService } from './chat-history.service';
import { CreateChatHistoryDto } from './dto/create-chat-history.dto';
import { UpdateChatHistoryDto } from './dto/update-chat-history.dto';

@Controller('chat-history')
export class ChatHistoryController {
  constructor(private readonly chatHistoryService: ChatHistoryService) {}

}
