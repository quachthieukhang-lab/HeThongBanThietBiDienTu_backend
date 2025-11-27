// src/chat/dto/create-chat.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty()
  @IsString()
  message: string;
}