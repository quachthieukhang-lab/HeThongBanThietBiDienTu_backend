import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CreateSubcategoryDto } from './dto/create-subcategory.dto'
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto'
import { StringUtil } from '@common/utils/string.util'
import { Subcategory } from './schemas/subcategory.schema'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Category } from '@categories/schemas/category.schema'
type SortKey = 'name' | 'sortOrder' | '-createdAt'
@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectModel(Subcategory.name)
    private readonly subcategoryModel: Model<Subcategory>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}
  async create(createSubcategoryDto: CreateSubcategoryDto) {
    const categoryId = StringUtil.toId(createSubcategoryDto.categoryId)
    const categoryExists = await this.categoryModel.exists({ _id: categoryId })
    if (!categoryExists) {
      throw new NotFoundException(`Category with ID ${createSubcategoryDto.categoryId} not found.`)
    }
    const slug = createSubcategoryDto.slug?.trim() || StringUtil.slugify(createSubcategoryDto.name)
    const exists = await this.subcategoryModel.exists({ categoryId, slug })
    if (exists) throw new BadRequestException('Slug already exists in this category')
    const doc = await this.subcategoryModel.create({
      categoryId,
      name: createSubcategoryDto.name.trim(),
      slug,
      icon: createSubcategoryDto.icon,
      sortOrder: createSubcategoryDto.sortOrder ?? 0,
      description: createSubcategoryDto.description,
      isActive: createSubcategoryDto.isActive ?? true,
      image: createSubcategoryDto.image,
      banner: createSubcategoryDto.banner,
      metaTitle: createSubcategoryDto.metaTitle,
      metaDescription: createSubcategoryDto.metaDescription,
      path: createSubcategoryDto.path ?? slug,
    })
    return doc.toObject()
  }

  async findAll(params: {
    page?: number
    limit?: number
    search?: string
    isActive?: string | boolean
    categoryId?: string
    sort?: SortKey
  }) {
    const page = Math.max(1, Number(params.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20))
    const skip = (page - 1) * limit

    const filter: any = {}
    if (params.categoryId) filter.categoryId = StringUtil.toId(params.categoryId)
    if (params.search) {
      const s = params.search.trim()
      filter.$or = [{ name: new RegExp(s, 'i') }, { slug: new RegExp(s, 'i') }]
    }
    if (params.isActive !== undefined) {
      const v =
        typeof params.isActive === 'string'
          ? params.isActive === 'true'
          : !!params.isActive
      filter.isActive = v
    }

    // dùng chuỗi sort để tránh lỗi TS kiểu SortOrder
    const sort: SortKey = params.sort ?? '-createdAt'

    const [items, total] = await Promise.all([
      this.subcategoryModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.subcategoryModel.countDocuments(filter),
    ])

    return {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  async findOne(id: string) {
    const doc = await this.subcategoryModel.findById(StringUtil.toId(id)).lean()
    if (!doc) throw new NotFoundException('Subcategory not found')
    return doc
  }

  // trong SubcategoriesService
  async findByCategoryId(
    categoryId: string,
    opts: { includeInactive?: boolean; sort?: 'name' | 'sortOrder' | '-createdAt' } = {},
  ) {
    // validate ObjectId
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid categoryId')
    }

    const filter: any = { categoryId: new Types.ObjectId(categoryId) }
    if (!opts.includeInactive) filter.isActive = true

    const sort =
      opts.sort === 'name'
        ? { name: 1 }
        : opts.sort === 'sortOrder'
          ? { sortOrder: 1, name: 1 }
          : { createdAt: -1, sortOrder: 1, name: 1 }

    const docs = await this.subcategoryModel.find(filter).sort(sort as any).lean()
    return docs
  }


  async update(id: string, dto: UpdateSubcategoryDto) {
    const _id = StringUtil.toId(id)
    const current = await this.subcategoryModel.findById(_id).lean()
    if (!current) throw new NotFoundException('Subcategory not found')

    const update: any = {}

    if (dto.categoryId !== undefined) {
      update.categoryId = StringUtil.toId(dto.categoryId)
    } else {
      update.categoryId = current.categoryId
    }

    if (dto.name !== undefined) update.name = dto.name.trim()

    if (dto.slug !== undefined || dto.name !== undefined) {
      const nextSlug = dto.slug?.trim() || (dto.name ? StringUtil.slugify(dto.name) : current.slug)
      const dup = await this.subcategoryModel.exists({
        _id: { $ne: _id },
        categoryId: update.categoryId,
        slug: nextSlug,
      })
      if (dup) throw new BadRequestException('Slug already exists in this category')
      update.slug = nextSlug
    }

    if (dto.icon !== undefined) update.icon = dto.icon
    if (dto.sortOrder !== undefined) update.sortOrder = dto.sortOrder
    if (dto.description !== undefined) update.description = dto.description
    if (dto.isActive !== undefined) update.isActive = dto.isActive
    if (dto.image !== undefined) update.image = dto.image
    if (dto.banner !== undefined) update.banner = dto.banner
    if (dto.metaTitle !== undefined) update.metaTitle = dto.metaTitle
    if (dto.metaDescription !== undefined) update.metaDescription = dto.metaDescription
    if (dto.path !== undefined) update.path = dto.path

    const updated = await this.subcategoryModel
      .findByIdAndUpdate(_id, { $set: update }, { new: true })
      .lean()

    return updated!
  }

  async deactivate(id: string) {
    const doc = await this.subcategoryModel
      .findByIdAndUpdate(StringUtil.toId(id), { $set: { isActive: false } }, { new: true })
      .lean()
    if (!doc) throw new NotFoundException('Subcategory not found')
    return doc
  }

  async activate(id: string) {
    const doc = await this.subcategoryModel
      .findByIdAndUpdate(StringUtil.toId(id), { $set: { isActive: true } }, { new: true })
      .lean()
    if (!doc) throw new NotFoundException('Subcategory not found')
    return doc
  }
  /** Hard delete: xoá hẳn (cẩn thận ràng buộc) */
  async removeHard(id: string) {
    const res = await this.subcategoryModel.deleteOne({ _id: StringUtil.toId(id) })
    if (res.deletedCount === 0) throw new NotFoundException('Subcategory not found')
    return { ok: true }
  }
}
