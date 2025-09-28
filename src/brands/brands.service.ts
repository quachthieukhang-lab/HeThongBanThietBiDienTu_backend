import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Brand } from './schemas/brand.schema'
import { CreateBrandDto } from './dto/create-brand.dto'
import { UpdateBrandDto } from './dto/update-brand.dto'
import { QueryBrandDto } from './dto/query-brand.dto'
import { StringUtil } from '@common/utils/string.util'

@Injectable()
export class BrandsService {
  constructor(@InjectModel(Brand.name) private readonly model: Model<Brand>) { }

  async create(createBrandDto: CreateBrandDto) {
    try {
      const slug = createBrandDto.slug?.trim() || StringUtil.slugify(createBrandDto.name)
      const exists = await this.model.exists({ slug })
      if (exists) throw new BadRequestException('Slug already exists')
      const doc = await this.model.create(createBrandDto)
      return doc
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Brand slug already exists')
      }
      throw err
    }
  }

  async findAll(q: QueryBrandDto) {
    const filter: Record<string, any> = {}
    if (q.slug) filter.slug = q.slug
    if (q.q) filter.name = { $regex: q.q, $options: 'i' }

    const page = q.page ?? 1
    const limit = q.limit ?? 20
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean().exec(),
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
    if (!doc) throw new NotFoundException('Brand not found')
    return doc
  }

  async findBySlug(slug: string) {
    const doc = await this.model.findOne({ slug }).lean().exec()
    if (!doc) throw new NotFoundException('Brand not found')
    return doc
  }

  async update(id: string, dto: UpdateBrandDto) {
    try {
      const doc = await this.model
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
        .exec()
      if (!doc) throw new NotFoundException('Brand not found')
      return doc
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Brand slug already exists')
      }
      throw err
    }
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id).exec()
    if (!res) throw new NotFoundException('Brand not found')
    return { deleted: true }
  }
}
