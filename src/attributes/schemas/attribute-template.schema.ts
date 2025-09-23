
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AttrType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Enum = 'enum',
  Multienum = 'multienum',
}

export class AttributeDef {
  @Prop({ required: true })
  key: string; 

  @Prop({ required: true })
  label: string; 

  @Prop({ enum: AttrType, required: true })
  type: AttrType;

  @Prop() unit?: string; 

  
  @Prop() min?: number;
  @Prop() max?: number;
  @Prop() step?: number;
  @Prop() decimals?: number;


  @Prop([String])
  options?: (string | number)[];

  @Prop({ default: false })
  required?: boolean;

  @Prop({ default: false })
  filterable?: boolean;

  @Prop({ default: false })
  sortable?: boolean;

  @Prop({ default: false })
  searchable?: boolean;

  @Prop() group?: string;
  @Prop() order?: number;
}

@Schema({ timestamps: true })
export class AttributeTemplate extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Subcategory', required: true })
  subcategoryId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string; 

  @Prop({ type: Number, default: 1 })
  version: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [AttributeDef], required: true })
  attributes: AttributeDef[];

  @Prop({ type: Object, default: {} })
  meta?: Record<string, any>;
}

export const AttributeTemplateSchema =
  SchemaFactory.createForClass(AttributeTemplate);


AttributeTemplateSchema.index({ subcategoryId: 1, isActive: 1 });
AttributeTemplateSchema.index({ subcategoryId: 1, version: -1 });
