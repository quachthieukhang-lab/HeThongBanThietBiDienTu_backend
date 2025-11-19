import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServicePackageDocument = ServicePackage & Document;

@Schema({ timestamps: true })
export class ServicePackage {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;                   // “Gói dịch vụ 1”

  @Prop({ trim: true })
  description?: string;           // mô tả nhanh

  @Prop({ required: true, min: 0 })
  price: number;                  // 1299000

  @Prop({ trim: true })
  duration?: string;              // “2 năm bảo hành chính hãng…”

  @Prop({ enum: ['install', 'warranty', 'addon', 'other'], default: 'other' })
  type: 'install' | 'warranty' | 'addon' | 'other';

  @Prop({ default: true })
  isActive: boolean;
}

export const ServicePackageSchema = SchemaFactory.createForClass(ServicePackage);
ServicePackageSchema.index({ name: 1 }, { unique: true });
