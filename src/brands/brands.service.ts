import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Brand } from './schemas/brand.schema'
import { CreateBrandDto } from './dto/create-brand.dto'
import { UpdateBrandDto } from './dto/update-brand.dto'
import { QueryBrandDto } from './dto/query-brand.dto'
import { StringUtil } from '@common/utils/string.util'
import { UploadService } from 'upload/upload.service'

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private readonly model: Model<Brand>,
    private readonly uploadService: UploadService,
  ) {}

  async create(createBrandDto: CreateBrandDto, file?: Express.Multer.File) {
    let savedImagePath: string | undefined
    try {
      const slug = createBrandDto.slug?.trim() || StringUtil.slugify(createBrandDto.name)
      if (await this.model.exists({ slug })) {
        throw new BadRequestException('Slug already exists')
      }
      const initialBrand = await this.model.create({
        ...createBrandDto,
        slug,
        logoUrl: undefined,
      })
      if (file) {
        savedImagePath = await this.uploadService.saveFile(file, 'brands')
        const updatedBrand = await this.model
          .findByIdAndUpdate(initialBrand._id, { logoUrl: savedImagePath }, { new: true })
          .exec()

        return updatedBrand
      }

      return initialBrand
    } catch (err: any) {
      if (savedImagePath) {
        await this.uploadService.deleteFile(savedImagePath)
      }
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

  async update(id: string, dto: UpdateBrandDto, file?: Express.Multer.File) {
    let savedImagePath: string | undefined

    try {
      // 1. Cập nhật các trường text/slug trước
      // Chúng ta không cập nhật logoUrl ở đây để tránh ghi đè URL cũ
      // Nếu có file mới, chúng ta sẽ cập nhật logoUrl sau khi lưu thành công
      const doc = await this.model
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
        .exec()

      if (!doc) {
        throw new NotFoundException('Brand not found')
      }

      // 2. NẾU CÓ FILE MỚI -> LƯU VÀ CẬP NHẬT LẠI DOCUMENT
      if (file) {
        // Lấy đường dẫn logo cũ để xóa sau này
        const oldLogoUrl = doc.logoUrl

        // Lưu file mới ra đĩa
        savedImagePath = await this.uploadService.saveFile(file, 'brands')

        // Cập nhật logoUrl mới vào document
        const updatedDoc = await this.model
          .findByIdAndUpdate(id, { logoUrl: savedImagePath }, { new: true })
          .exec()

        // 3. XÓA FILE CŨ THÀNH CÔNG (Sau khi DB đã lưu đường dẫn mới)
        if (oldLogoUrl) {
          // Logic xóa file cũ khỏi ổ đĩa
          // Bỏ comment dòng này để kích hoạt xóa file cũ
          // await this.uploadService.deleteFile(oldLogoUrl)
        }

        return updatedDoc
      }

      // Trả về document đã cập nhật (nếu không có file mới)
      return doc
    } catch (err: any) {
      // ⚠️ 4. XỬ LÝ LỖI: XÓA FILE MỚI NẾU LỖI XẢY RA
      if (savedImagePath) {
        // Nếu file đã được lưu nhưng có lỗi DB (ví dụ: lỗi slug 11000)
        // thì phải xóa file đã lưu
        await this.uploadService.deleteFile(savedImagePath)
      }

      if (err?.code === 11000) {
        throw new ConflictException('Brand slug already exists')
      }
      throw err
    }
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id).exec()
    if (!res) throw new NotFoundException('Brand not found')

    // Xóa luôn file logo nếu có
    if (res.logoUrl) {
      await this.uploadService.deleteFile(res.logoUrl)
    }

    return { deleted: true }
  }
}
