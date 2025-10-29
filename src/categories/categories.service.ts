
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { InjectModel, InjectConnection } from '@nestjs/mongoose'
import { Model, Connection } from 'mongoose'
import { Category } from './schemas/category.schema'
import { StringUtil } from '@common/utils/string.util'
import { UploadService } from '../upload/upload.service'

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectConnection() private readonly connection: Connection,
    private readonly uploadService: UploadService,
  ) {}
  async create(
    createCategoryDto: CreateCategoryDto,
    imageFile?: Express.Multer.File,
    bannerFile?: Express.Multer.File,
  ) {
    const slug = createCategoryDto.slug?.trim() || StringUtil.slugify(createCategoryDto.name)
    const exists = await this.categoryModel.exists({ slug })
    if (exists) throw new BadRequestException('Slug already exists')

    // Tạo document trước mà không có ảnh
    const initialDoc = new this.categoryModel({
      ...createCategoryDto,
      slug,
      image: undefined,
      banner: undefined,
      path: createCategoryDto.path ?? slug,
    })

    let imageUrl: string | undefined
    let bannerUrl: string | undefined

    try {
      // Lưu document ban đầu
      await initialDoc.save()

      const update: any = {}
      if (imageFile) {
        imageUrl = await this.uploadService.saveFile(imageFile, 'categories')
        update.image = imageUrl
      }
      if (bannerFile) {
        bannerUrl = await this.uploadService.saveFile(bannerFile, 'categories')
        update.banner = bannerUrl
      }

      if (Object.keys(update).length > 0) {
        Object.assign(initialDoc, update)
        await initialDoc.save()
      }

      return initialDoc.toObject()
    } catch (error) {
      // Rollback: Xóa file đã lưu và document đã tạo nếu có lỗi
      if (imageUrl) await this.uploadService.deleteFile(imageUrl)
      if (bannerUrl) await this.uploadService.deleteFile(bannerUrl)
      if (initialDoc?.isNew === false) await initialDoc.deleteOne()
      throw error // Ném lại lỗi ban đầu
    }
  }

  async findAll(
    params: {
      page?: number
      limit?: number
      search?: string
      isActive?: string | boolean // 'true' | 'false' | boolean
      sort?: 'name' | 'sortOrder' | '-createdAt'
    } = {},
  ) {
    const page = Math.max(1, Number(params.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20))
    const skip = (page - 1) * limit

    const filter: any = {}
    if (params.search) {
      const s = params.search.trim()
      filter.$or = [{ name: new RegExp(s, 'i') }, { slug: new RegExp(s, 'i') }]
    }
    if (params.isActive !== undefined) {
      const v = typeof params.isActive === 'string' ? params.isActive === 'true' : !!params.isActive
      filter.isActive = v
    }

    const sort =
      params.sort === 'name' ? 'name' : params.sort === 'sortOrder' ? 'sortOrder' : '-createdAt'

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

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    imageFile?: Express.Multer.File,
    bannerFile?: Express.Multer.File,
  ) {
    const currentCategory = await this.categoryModel.findById(StringUtil.toId(id))
    if (!currentCategory) {
      throw new NotFoundException('Category not found')
    }

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
    if (updateCategoryDto.description !== undefined)
      update.description = updateCategoryDto.description
    if (updateCategoryDto.isActive !== undefined) update.isActive = !!updateCategoryDto.isActive
    if (updateCategoryDto.metaTitle !== undefined) update.metaTitle = updateCategoryDto.metaTitle
    if (updateCategoryDto.metaDescription !== undefined)
      update.metaDescription = updateCategoryDto.metaDescription
    if (updateCategoryDto.path !== undefined) update.path = updateCategoryDto.path

    // Áp dụng các thay đổi text trước
    Object.assign(currentCategory, update)

    let newImageUrl: string | undefined
    let newBannerUrl: string | undefined
    const oldImageUrl = currentCategory.image
    const oldBannerUrl = currentCategory.banner

    try {
      // Lưu các thay đổi text vào DB
      await currentCategory.save()

      // Xử lý upload file mới
      if (imageFile) {
        newImageUrl = await this.uploadService.saveFile(imageFile, 'categories')
        currentCategory.image = newImageUrl
      } else if (updateCategoryDto.image === null) {
        currentCategory.image = undefined
      }

      if (bannerFile) {
        newBannerUrl = await this.uploadService.saveFile(bannerFile, 'categories')
        currentCategory.banner = newBannerUrl
      } else if (updateCategoryDto.banner === null) {
        currentCategory.banner = undefined
      }

      // Lưu lại document với đường dẫn ảnh mới
      const updatedDoc = await currentCategory.save()

      // Xóa file cũ sau khi mọi thứ đã thành công
      if (newImageUrl !== undefined && oldImageUrl) await this.uploadService.deleteFile(oldImageUrl)
      if (newBannerUrl !== undefined && oldBannerUrl) await this.uploadService.deleteFile(oldBannerUrl)

      return updatedDoc.toObject()
    } catch (error) {
      // Rollback: Xóa file mới đã upload nếu có lỗi
      if (newImageUrl) await this.uploadService.deleteFile(newImageUrl)
      if (newBannerUrl) await this.uploadService.deleteFile(newBannerUrl)
      throw error // Ném lại lỗi ban đầu
    }
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
