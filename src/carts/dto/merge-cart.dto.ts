import { IsNotEmpty, IsString } from 'class-validator';

export class MergeCartDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;    // cart guest

  @IsNotEmpty()
  @IsString()
  userId: string;       // user đích (khi login)
}