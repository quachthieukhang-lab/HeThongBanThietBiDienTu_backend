import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CreateSubcategoryDto } from './dto/create-subcategory.dto'
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto'
import { StringUtil } from '@common/utils/string.util'
import { Subcategory } from './schemas/subcategory.schema'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Category } from '@categories/schemas/category.schema'
import { UploadService } from '../upload/upload.service'

type SortKey = 'name' | 'sortOrder' | '-createdAt'

interface SubcategoryFiles {
  image?: Express.Multer.File
  banner?: Express.Multer.File
}

@Injectable()
export class SubcategoriesService {
  constructor(
    @InjectModel(Subcategory.name)
    private readonly subcategoryModel: Model<Subcategory>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    private readonly uploadService: UploadService,
  ) { }
  
  async create(
    createSubcategoryDto: CreateSubcategoryDto,
    files: SubcategoryFiles = {},
  ) {
    const categoryId = StringUtil.toId(createSubcategoryDto.categoryId)
    const categoryExists = await this.categoryModel.exists({ _id: categoryId })

    if (!categoryExists) {
      throw new NotFoundException(`Category with ID ${createSubcategoryDto.categoryId} not found.`)
    }
    const slug = createSubcategoryDto.slug?.trim() || StringUtil.slugify(createSubcategoryDto.name)
    const exists = await this.subcategoryModel.exists({ categoryId, slug })
    if (exists) throw new BadRequestException('Slug already exists in this category')
    const doc = await this.subcategoryModel.create({
      ...createSubcategoryDto,
      categoryId,
      slug,
    })

    const update: any = {}
    let hasFileUpdate = false

    try {
      if (files.image) {
        update.image = await this.uploadService.saveFile(files.image, 'subcategories')
        hasFileUpdate = true
      }
      if (files.banner) {
        update.banner = await this.uploadService.saveFile(files.banner, 'subcategories')
        hasFileUpdate = true
      }

      if (hasFileUpdate) {
        const updatedDoc = await this.subcategoryModel.findByIdAndUpdate(doc._id, { $set: update }, { new: true }).lean()
        return updatedDoc!
      }

      return doc.toObject()
    } catch (error) {
      // Rollback: Xóa document đã tạo và các file đã upload nếu có lỗi
      await this.subcategoryModel.findByIdAndDelete(doc._id)
      if (update.image) await this.uploadService.deleteFile(update.image)
      if (update.banner) await this.uploadService.deleteFile(update.banner)
      throw error
    }
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: string | boolean;
    categoryId?: string;
    sort?: 'name' | 'sortOrder' | '-createdAt';
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    // categoryId: chỉ set nếu hợp lệ
    if (params.categoryId && Types.ObjectId.isValid(params.categoryId)) {
      filter.categoryId = new Types.ObjectId(params.categoryId);
    }

    // search: dùng cả name/slug + (optional) searchKey
    const normalize = (str: string) => str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (params.search) {
      const s = params.search.trim();
      const sNorm = normalize(s);
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { slug: { $regex: s, $options: 'i' } },
        { searchKey: { $regex: sNorm, $options: 'i' } }, // nếu bạn có trường này
      ];
    }

    if (params.isActive !== undefined) {
      const v = typeof params.isActive === 'string' ? params.isActive === 'true' : !!params.isActive
      filter.isActive = v;
    }

    const sort: 'name' | 'sortOrder' | '-createdAt' = params.sort ?? '-createdAt';

    const q = this.subcategoryModel
      .find(filter)
      .populate('categoryId')
      .collation({ locale: 'vi', strength: 1 })   // để search ko phân biệt dấu/case
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    const [items, total] = await Promise.all([
      q,
      this.subcategoryModel.countDocuments(filter).collation({ locale: 'vi', strength: 1 }),
    ]);

    return { items, page, limit, total, pages: Math.ceil(total / limit) };
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

    const docs = await this.subcategoryModel
      .find(filter)
      .sort(sort as any)
      .lean()
    return docs
  }


  async update(
    id: string,
    dto: UpdateSubcategoryDto,
    files: SubcategoryFiles = {},
  ) {
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
    if (dto.metaTitle !== undefined) update.metaTitle = dto.metaTitle
    if (dto.metaDescription !== undefined) update.metaDescription = dto.metaDescription
    if (dto.path !== undefined) update.path = dto.path

    // Xử lý upload file
    const savedPaths: { image?: string, banner?: string } = {}
    try {
      if (files.image) {
        savedPaths.image = await this.uploadService.saveFile(files.image, 'subcategories')
        update.image = savedPaths.image
      }
      if (files.banner) {
        savedPaths.banner = await this.uploadService.saveFile(files.banner, 'subcategories')
        update.banner = savedPaths.banner
      }
    } catch (error) {
      // Rollback file uploads on error
      if (savedPaths.image) await this.uploadService.deleteFile(savedPaths.image)
      if (savedPaths.banner) await this.uploadService.deleteFile(savedPaths.banner)
      throw error
    }

    // Xóa file cũ nếu có file mới được upload
    if (savedPaths.image && current.image) {
      await this.uploadService.deleteFile(current.image)
    }
    if (savedPaths.banner && current.banner) {
      await this.uploadService.deleteFile(current.banner)
    }

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
    const doc = await this.subcategoryModel.findByIdAndDelete(StringUtil.toId(id)).lean()
    if (!doc) throw new NotFoundException('Subcategory not found')

    // Xóa file liên quan
    if (doc.image) {
      await this.uploadService.deleteFile(doc.image)
    }
    if (doc.banner) {
      await this.uploadService.deleteFile(doc.banner)
    }
    return { ok: true }
  }
}
