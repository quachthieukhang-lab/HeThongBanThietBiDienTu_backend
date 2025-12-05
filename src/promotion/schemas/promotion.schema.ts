import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DiscountType } from '../dto/create-promotion.dto';

export type PromotionDocument = Promotion & Document;

@Schema({ timestamps: true })
export class Promotion {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: Object.values(DiscountType) })
  discount_type: DiscountType;

  @Prop({ required: true })
  discount_amount: number;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  discount_value: number;

  @Prop({ required: true })
  start_date: Date;

  @Prop({ required: true })
  end_date: Date;
  
  @Prop({ required: true})
  status: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
