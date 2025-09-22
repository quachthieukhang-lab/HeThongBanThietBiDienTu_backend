// src/attributes/schemas/attribute-template.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AttrType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Enum = 'enum',
  Multienum = 'multienum', // nhiều giá trị (VD: hỗ trợ Wi-Fi a/b/g/n/ac/ax)
}

export class AttributeDef {
  @Prop({ required: true })
  key: string; // khóa chuẩn hóa, vd: "screen_size", "ram"

  @Prop({ required: true })
  label: string; // nhãn hiển thị, vd: "Màn hình (inch)"

  @Prop({ enum: AttrType, required: true })
  type: AttrType;

  @Prop() unit?: string; // đơn vị hiển thị, vd: "inch", "GB", "mAh"

  // áp dụng cho number
  @Prop() min?: number;
  @Prop() max?: number;
  @Prop() step?: number;
  @Prop() decimals?: number;

  // áp dụng cho enum/multienum
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

  @Prop() group?: string; // nhóm hiển thị, vd: "Màn hình", "CPU", "Pin"

  @Prop() order?: number; // thứ tự hiển thị trong form/bảng thông số
}

@Schema({ timestamps: true })
export class AttributeTemplate extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string; // "Điện thoại - Template v1"

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

// Indexes
AttributeTemplateSchema.index({ categoryId: 1, isActive: 1 });
AttributeTemplateSchema.index({ categoryId: 1, version: -1 });
