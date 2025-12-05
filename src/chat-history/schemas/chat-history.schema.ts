// src/chat/schemas/chat-history.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatHistoryDocument = ChatHistory & Document;

@Schema({ timestamps: true })
export class ChatHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role: 'user' | 'assistant' | 'system';

  @Prop({ required: true })
  content: string; 

}

export const ChatHistorySchema = SchemaFactory.createForClass(ChatHistory);
