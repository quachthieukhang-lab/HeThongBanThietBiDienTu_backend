import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Category } from './schemas/category.schema'
import { StringUtil } from '@common/utils/string.util'

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
  ) { }
  async create(createCategoryDto: CreateCategoryDto) {
    const slug = createCategoryDto.slug?.trim() || StringUtil.slugify(createCategoryDto.name)
    const exists = await this.categoryModel.exists({ slug })
    if (exists) throw new BadRequestException('Slug already exists')

    const doc = await this.categoryModel.create({
      name: createCategoryDto.name.trim(),
      slug,
      icon: createCategoryDto.icon,
      sortOrder: createCategoryDto.sortOrder ?? 0,
      description: createCategoryDto.description,
      isActive: createCategoryDto.isActive ?? true,
      image: createCategoryDto.image,
      banner: createCategoryDto.banner,
      metaTitle: createCategoryDto.metaTitle,
      metaDescription: createCategoryDto.metaDescription,
      path: createCategoryDto.path ?? slug, // hoặc để FE/SEO set sau
    })
    return doc.toObject()
  }

  async findAll(params: {
    page?: number
    limit?: number
    search?: string
    isActive?: string | boolean // 'true' | 'false' | boolean
    sort?: 'name' | 'sortOrder' | '-createdAt'
  } = {}) {
    const page = Math.max(1, Number(params.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20))
    const skip = (page - 1) * limit

    const filter: any = {}
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

    const sort =
      params.sort === 'name'
        ? 'name'
        : params.sort === 'sortOrder'
          ? 'sortOrder'
          : '-createdAt'

    const [items, total] = await Promise.all([
      this.categoryModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.categoryModel.countDocuments(filter),
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
    const cat = await this.categoryModel.findById(StringUtil.toId(id)).lean()
    if (!cat) throw new NotFoundException('Category not found')
    return cat
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const update: any = {}

    if (updateCategoryDto.name !== undefined) update.name = updateCategoryDto.name.trim()

    if (updateCategoryDto.slug !== undefined) {
      const slug = updateCategoryDto.slug.trim() || StringUtil.slugify(updateCategoryDto.name ?? '')
      const dup = await this.categoryModel.exists({
        _id: { $ne: StringUtil.toId(id) },
        slug,
      })
      if (dup) throw new BadRequestException('Slug already exists')
      update.slug = slug
    } else if (updateCategoryDto.name !== undefined && !updateCategoryDto.slug) {
      // nếu đổi name mà không gửi slug, có thể tự cập nhật path thôi, giữ slug cũ
      update.path ??= undefined // tuỳ policy, có thể regenerate path ở đây
    }

    if (updateCategoryDto.icon !== undefined) update.icon = updateCategoryDto.icon
    if (updateCategoryDto.sortOrder !== undefined) update.sortOrder = updateCategoryDto.sortOrder
    if (updateCategoryDto.description !== undefined) update.description = updateCategoryDto.description
    if (updateCategoryDto.isActive !== undefined) update.isActive = updateCategoryDto.isActive
    if (updateCategoryDto.image !== undefined) update.image = updateCategoryDto.image
    if (updateCategoryDto.banner !== undefined) update.banner = updateCategoryDto.banner
    if (updateCategoryDto.metaTitle !== undefined) update.metaTitle = updateCategoryDto.metaTitle
    if (updateCategoryDto.metaDescription !== undefined)
      update.metaDescription = updateCategoryDto.metaDescription
    if (updateCategoryDto.path !== undefined) update.path = updateCategoryDto.path

    const doc = await this.categoryModel
      .findByIdAndUpdate(StringUtil.toId(id), { $set: update }, { new: true })
      .lean()

    if (!doc) throw new NotFoundException('Category not found')
    return doc
  }
  async deactivate(id: string) {
    const doc = await this.categoryModel
      .findByIdAndUpdate(StringUtil.toId(id), { $set: { isActive: false } }, { new: true })
      .lean()
    if (!doc) throw new NotFoundException('Category not found')
    return doc
  }
  async active(id: string) {
    const doc = await this.categoryModel
      .findByIdAndUpdate(StringUtil.toId(id), { $set: { isActive: true } }, { new: true })
      .lean()
    if (!doc) throw new NotFoundException('Category not found')
    return doc
  }
  async removeHard(id: string) {
    // TODO: chặn xoá nếu còn subcategories/products tham chiếu
    const res = await this.categoryModel.deleteOne({ _id: StringUtil.toId(id) })
    if (res.deletedCount === 0) throw new NotFoundException('Category not found')
    return { ok: true }
  }

}
