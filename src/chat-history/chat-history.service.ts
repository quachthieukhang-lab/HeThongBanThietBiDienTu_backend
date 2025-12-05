// src/chat/chat-history.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatHistory, ChatHistoryDocument } from './schemas/chat-history.schema';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

@Injectable()
export class ChatHistoryService {
  private readonly logger = new Logger(ChatHistoryService.name);

  constructor(
    @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>,
  ) {}

  async saveMessage(
    userId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
  ): Promise<ChatHistoryDocument> {
    try {
      const newMessage = new this.chatHistoryModel({
        userId: new Types.ObjectId(userId),
        role,
        content,
      });
      return await newMessage.save();
    } catch (error) {
      this.logger.error(`Failed to save chat message for user ${userId}:`, error);
      throw error;
    }
  }

  async getConversationHistory(
    userId: string,
    limit: number = 20, // Giới hạn số lượng tin nhắn lịch sử để tránh vượt quá token limit của AI
  ): Promise<ChatCompletionMessageParam[]> {
    try {
      const history = await this.chatHistoryModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: 1 }) // Sắp xếp theo thời gian tạo tăng dần
        .limit(limit)
        .lean(); // Trả về plain JavaScript objects thay vì Mongoose documents

      return history.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
    } catch (error) {
      this.logger.error(`Failed to retrieve chat history for user ${userId}:`, error);
      return []; // Trả về mảng rỗng nếu có lỗi
    }
  }
}
