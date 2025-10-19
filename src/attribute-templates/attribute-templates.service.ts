// src/attribute-templates/attribute-template.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types, Connection } from 'mongoose'
import { AttributeTemplate, AttributeTemplateDocument } from './schemas/attribute-template.schema'
import {
  CreateAttributeTemplateDto,
  QueryAttributeTemplateDto,
  UpdateAttributeTemplateDto,
} from './dto/index'
import { InjectConnection } from '@nestjs/mongoose'
import { Subcategory } from '@subcategories/schemas/subcategory.schema'
import { StringUtil } from '@common/utils/string.util'

@Injectable()
export class AttributeTemplateService {
  constructor(
    @InjectModel(AttributeTemplate.name)
    private readonly model: Model<AttributeTemplateDocument>,
    @InjectModel(Subcategory.name)
    private readonly subcategoryModel: Model<Subcategory>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(dto: CreateAttributeTemplateDto) {
    const subcategoryId = StringUtil.toId(dto.subcategoryId)
    const subcategory = await this.subcategoryModel.findById(subcategoryId).lean()
    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${dto.subcategoryId} not found.`)
    }
    const name = dto.name?.trim() || subcategory.name
    if (!name) {
      throw new ConflictException('Name is required for attribute template')
    }
    try {
      const doc = await this.model.create({
        ...dto,
        subcategoryId: new Types.ObjectId(subcategoryId),
        name: name,
      })
      return doc
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException(
          'Duplicate template for this subcategory/version or active already exists',
        )
      }
      throw err
    }
  }

  async findAll(q: QueryAttributeTemplateDto) {
    const filter: Record<string, any> = {}
    if (q.subcategoryId) filter.subcategoryId = new Types.ObjectId(q.subcategoryId)
    if (typeof q.isActive === 'boolean') filter.isActive = q.isActive

    const page = q.page && q.page > 0 ? q.page : 1
    const limit = q.limit && q.limit > 0 ? q.limit : 20
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ updatedAt: -1, version: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter),
    ])

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).lean().exec()
    if (!doc) throw new NotFoundException('AttributeTemplate not found')
    return doc
  }

  async findBySubcategoryIdAndVersion(subcategoryId: string, version: number) {
    const doc = await this.model
      .findOne({ subcategoryId: new Types.ObjectId(subcategoryId), version })
      .lean()
      .exec()
    if (!doc) throw new NotFoundException('AttributeTemplate not found')
    return doc
  }
  async update(id: string, dto: UpdateAttributeTemplateDto) {
    // Không cho đổi subcategoryId/version trong thiết kế hiện tại
    // Chỉ cho phép update các trường hợp lệ (ví dụ: name, isActive, fields...)
    const allowedFields = ['name', 'isActive', 'attributes', 'meta']
    const updateData: Record<string, any> = {}
    for (const key of allowedFields) {
      if (key in dto) updateData[key] = (dto as any)[key]
    }
    if (Object.keys(updateData).length === 0) {
      throw new ConflictException('No valid fields to update')
    }
    try {
      const doc = await this.model
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .exec()
      if (!doc) throw new NotFoundException('AttributeTemplate not found')
      return doc
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Unique index violated')
      }
      throw err
    }
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id).exec()
    if (!res) throw new NotFoundException('AttributeTemplate not found')
    return { deleted: true }
  }

  /** Lấy template đang active theo subcategory */
  async getActive(subcategoryId: string) {
    const doc = await this.model
      .findOne({
        subcategoryId: new Types.ObjectId(subcategoryId),
        isActive: true,
      })
      .lean()
      .exec()
    if (!doc) throw new NotFoundException('Active template not found for this subcategory')
    return doc
  }

  /**
   * Kích hoạt template theo id:
   * - Tắt isActive của các template khác cùng subcategory
   * - Bật isActive cho template này
   * Dùng transaction để tránh race condition (nếu Mongo chạy ReplicaSet).
   */
  async activate(id: string) {
    const target = await this.model.findById(id).exec()
    if (!target) throw new NotFoundException('AttributeTemplate not found')

    const session = await this.connection.startSession()
    try {
      await session.withTransaction(async () => {
        await this.model.updateMany(
          { subcategoryId: target.subcategoryId, _id: { $ne: target._id }, isActive: true },
          { $set: { isActive: false } },
          { session },
        )
        // Nếu đang là active rồi thì vẫn return OK
        await this.model.updateOne(
          { _id: target._id },
          { $set: { isActive: true } },
          { session, runValidators: true },
        )
      })
    } catch (err: any) {
      if (err?.code === 11000) {
        // Partial unique có thể nổ nếu race
        throw new ConflictException('Another active template already exists')
      }
      throw err
    } finally {
      session.endSession()
    }

    const updated = await this.model.findById(id).lean().exec()
    return updated
  }
}
