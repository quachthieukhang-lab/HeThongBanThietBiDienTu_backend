import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose'

export type AttributeTemplateDocument = HydratedDocument<AttributeTemplate>

export enum AttrType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Enum = 'enum',
  Multienum = 'multienum',
}

@Schema({ _id: false, id: false, timestamps: false, versionKey: false })
export class AttributeDef {
  @Prop({ required: true, trim: true })
  key!: string

  @Prop({ required: true, trim: true })
  label!: string

  @Prop({ required: true, enum: Object.values(AttrType) })
  type!: AttrType

  @Prop()
  unit?: string

  @Prop()
  min?: number

  @Prop()
  max?: number

  @Prop()
  step?: number

  @Prop()
  decimals?: number

  // Cho phép string | number
  @Prop({ type: [MongooseSchema.Types.Mixed], default: undefined })
  options?: Array<string | number>

  @Prop({ default: false })
  required?: boolean

  @Prop({ default: false })
  filterable?: boolean

  @Prop({ default: false })
  sortable?: boolean

  @Prop({ default: false })
  searchable?: boolean

  @Prop({ trim: true })
  group?: string

  @Prop()
  order?: number
}

export const AttributeDefSchema = SchemaFactory.createForClass(AttributeDef)

/** Collection: attribute_templates */
@Schema({ collection: 'attribute_templates', timestamps: true })
export class AttributeTemplate {
  @Prop({ type: Types.ObjectId, ref: 'Subcategory', required: true, index: true })
  subcategoryId!: Types.ObjectId

  @Prop({ required: true, trim: true })
  name!: string

  @Prop({ type: Number, default: 1, min: 1 })
  version!: number

  @Prop({ default: true })
  isActive!: boolean

  @Prop({
    type: [AttributeDefSchema],
    required: true,
    validate: {
      validator: (arr: AttributeDef[]) => Array.isArray(arr) && arr.length > 0,
      message: 'attributes must be a non-empty array',
    },
  })
  attributes!: AttributeDef[]

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  meta?: Record<string, any>
}

export const AttributeTemplateSchema = SchemaFactory.createForClass(AttributeTemplate)

// Duy nhất theo (subcategoryId, version)
AttributeTemplateSchema.index({ subcategoryId: 1, version: -1 }, { unique: true })

// Chỉ 1 template đang active cho mỗi subcategory (partial unique)
AttributeTemplateSchema.index(
  { subcategoryId: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
)

// key không trùng trong cùng template
AttributeTemplateSchema.pre('validate', function (next) {
  const doc = this as AttributeTemplateDocument
  const keys = (doc.attributes ?? []).map(a => a.key)
  if (new Set(keys).size !== keys.length) {
    return next(new Error('Duplicate attribute.key in template'))
  }
  next()
})

// validate attributes trước khi save
AttributeTemplateSchema.pre('validate', function (next) {
  const doc = this as AttributeTemplateDocument
  for (const a of doc.attributes ?? []) {
    // enum/multienum cần options không rỗng
    if (a.type === AttrType.Enum || a.type === AttrType.Multienum) {
      if (!a.options || a.options.length === 0) {
        return next(new Error(`Attribute "${a.key}" requires non-empty options`))
      }
    }
    // number cần min <= max
    if (a.type === AttrType.Number && a.min !== undefined && a.max !== undefined && a.min > a.max) {
      return next(new Error(`Attribute "${a.key}" has min > max`))
    }
  }
  next()
})
