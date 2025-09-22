// src/categories/schemas/subcategory.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Subcategory extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop()
  description?: string;
  
  @Prop()
  image?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SubcategorySchema = SchemaFactory.createForClass(Subcategory);

// Index để query nhanh theo category
SubcategorySchema.index({ categoryId: 1, isActive: 1 });
