/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Address } from './schemas/address.schema'
import { CreateAddressDto } from './dto/create-address.dto'
import { UpdateAddressDto } from './dto/update-address.dto'
import { StringUtil } from '@common/utils/string.util'
import { User } from '@users/schemas/user.schema'

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name) private readonly addressModel: Model<Address>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  private async unsetDefaultForUser(userId: Types.ObjectId) {
    await this.addressModel.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } })
  }

  /** tạo address (nếu isDefault=true → hạ default các address khác) */
  async create(dto: CreateAddressDto) {
    const userId = StringUtil.toId(dto.userId)
    const user = await this.userModel.findById(userId)
    if (!user) throw new NotFoundException('User not found')

    if (dto.isDefault) {
      await this.unsetDefaultForUser(userId)
    } else {
      // nếu user chưa có địa chỉ nào → auto set default
      const count = await this.addressModel.countDocuments({ userId })
      if (count === 0) dto.isDefault = true
    }

    const doc = await this.addressModel.create({
      userId,
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      line1: dto.line1.trim(),
      line2: dto.line2?.trim(),
      ward: dto.ward?.trim(),
      district: dto.district?.trim(),
      city: dto.city.trim(),
      province: dto.province?.trim(),
      country: dto.country?.trim() ?? 'VN',
      postalCode: dto.postalCode?.trim(),
      isDefault: dto.isDefault ?? false,
    })

    return doc.toObject()
  }
  // src/addresses/addresses.service.ts

  async findAll(params: {
    page?: number
    limit?: number
    search?: string
    userId?: string
    sort?: '-updatedAt' | 'fullName' | 'city'
  }) {
    const page = Math.max(1, Number(params.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20))
    const skip = (page - 1) * limit

    const filter: any = {}
    if (params.userId) {
      if (!Types.ObjectId.isValid(params.userId)) throw new BadRequestException('Invalid userId')
      filter.userId = new Types.ObjectId(params.userId)
    }
    if (params.search) {
      const s = params.search.trim()
      filter.$or = [
        { fullName: new RegExp(s, 'i') },
        { phone: new RegExp(s, 'i') },
        { line1: new RegExp(s, 'i') },
        { city: new RegExp(s, 'i') },
      ]
    }

    // sắp xếp mặc định: default trước, rồi updatedAt mới nhất
    const sort: { [key: string]: 1 | -1 } =
      params.sort === 'fullName'
        ? { isDefault: -1, fullName: 1, updatedAt: -1 }
        : params.sort === 'city'
          ? { isDefault: -1, city: 1, updatedAt: -1 }
          : { isDefault: -1, updatedAt: -1 }

    const [items, total] = await Promise.all([
      this.addressModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.addressModel.countDocuments(filter),
    ])

    return {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  async findByUser(userId: string) {
    const _uid = StringUtil.toId(userId)
    return this.addressModel.find({ userId: _uid }).sort({ isDefault: -1, updatedAt: -1 }).lean()
  }

  async findOne(id: string) {
    const doc = await this.addressModel.findById(StringUtil.toId(id)).lean()
    if (!doc) throw new NotFoundException('Address not found')
    return doc
  }

  /** cập nhật (nếu set isDefault=true → hạ default cái khác) */
  async update(id: string, dto: UpdateAddressDto) {
    const _id = StringUtil.toId(id)
    const current = await this.addressModel.findById(_id)
    if (!current) throw new NotFoundException('Address not found')

    const update: any = {}
    if (dto.userId) {
      const nextUserId = StringUtil.toId(dto.userId)
      update.userId = nextUserId
    }

    if (dto.fullName !== undefined) update.fullName = dto.fullName.trim()
    if (dto.phone !== undefined) update.phone = dto.phone.trim()
    if (dto.line1 !== undefined) update.line1 = dto.line1.trim()
    if (dto.line2 !== undefined) update.line2 = dto.line2?.trim()
    if (dto.ward !== undefined) update.ward = dto.ward?.trim()
    if (dto.district !== undefined) update.district = dto.district?.trim()
    if (dto.city !== undefined) update.city = dto.city.trim()
    if (dto.province !== undefined) update.province = dto.province?.trim()
    if (dto.country !== undefined) update.country = dto.country?.trim()
    if (dto.postalCode !== undefined) update.postalCode = dto.postalCode?.trim()
    if (dto.isDefault !== undefined) update.isDefault = dto.isDefault

    // nếu chuyển sang default → unset các địa chỉ khác
    const nextUserId: Types.ObjectId = update.userId ?? current.userId
    if (dto.isDefault === true) {
      await this.unsetDefaultForUser(nextUserId)
    }

    const saved = await this.addressModel
      .findByIdAndUpdate(_id, { $set: update }, { new: true })
      .lean()

    return saved!
  }
  async setDefault(id: string) {
    const _id = StringUtil.toId(id)
    const address = await this.addressModel.findById(_id)
    if (!address) throw new NotFoundException('Address not found')
    await this.unsetDefaultForUser(address.userId)
    address.isDefault = true
    await address.save()
    return address.toObject()
  }

  /** xoá (nếu xoá default → set 1 cái khác làm default nếu còn) */
  async remove(id: string) {
    const _id = StringUtil.toId(id)
    const doc = await this.addressModel.findById(_id)
    if (!doc) throw new NotFoundException('Address not found')

    const wasDefault = doc.isDefault
    const userId = doc.userId

    await doc.deleteOne()

    if (wasDefault) {
      const another = await this.addressModel.findOne({ userId }).sort({ updatedAt: -1 }).exec()
      if (another) {
        another.isDefault = true
        await another.save()
      }
    }
    return { ok: true }
  }
}
