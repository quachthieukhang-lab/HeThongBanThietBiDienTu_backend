import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { CreateUserDto } from '@users/dto/create-user.dto'
import { UpdateUserDto } from '@users/dto/update-user.dto'
import { User, UserRole, UserStatus } from '@users/schemas/user.schema'
import * as bcrypt from 'bcrypt'
import { FindAllQuery } from '@users/dto/find-all-query.dto'
import { CartsService } from 'carts/carts.service'
import { Cart } from 'carts/schemas/cart.schema'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly cartsService: CartsService,
  ) {}
  private toSafe(user: any) {
    if (!user) return user
    const { passwordHash, __v, ...rest } = user
    return rest
  }

  private toId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id')
    return new Types.ObjectId(id)
  }
  async create(dto: CreateUserDto) {
    const existed = await this.userModel.exists({ email: dto.email.toLowerCase() });
    if (existed) throw new BadRequestException('Email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12)

    const doc = await this.userModel.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase(),
      passwordHash,
      phone: dto.phone ?? null,
      roles: dto.roles?.length ? dto.roles : [UserRole.Customer],
      status: dto.status ?? UserStatus.Active,
      defaultAddressId: dto.defaultAddressId ?? null,
      avatarUrl: dto.avatarUrl ?? null,
    }) as User & { _id: Types.ObjectId }; // Ensure _id is ObjectId

    await this.cartsService.findOrCreateActiveCart(doc._id);

    return doc.toObject();
  }
  async createGuestUser(): Promise<User> {
    const guestUser = new this.userModel({
      name: 'Guest',
      email: `guest_${Date.now()}@example.com`,
      passwordHash: '', // Không cần mật khẩu
      roles: [UserRole.Guest],
      status: UserStatus.Active,
    });

    return guestUser.save();
  }

  async findAll(q: FindAllQuery = {}) {
    const page = Math.max(1, Number(q.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20))
    const skip = (page - 1) * limit

    const filter: any = {}
    if (q.status) filter.status = q.status
    if (q.roles?.length) filter.roles = { $in: q.roles }
    if (q.search) {
      const s = q.search.trim()
      filter.$or = [
        { name: new RegExp(s, 'i') },
        { email: new RegExp(s, 'i') },
        { phone: new RegExp(s, 'i') },
      ]
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-passwordHash')     // ẩn pass
        .lean(),
      this.userModel.countDocuments(filter),
    ])

    return {
      users,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(this.toId(id)).select('-passwordHash').lean()
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).lean()
  }

  async update(id: string, dto: UpdateUserDto) {
    const update: any = {}

    if (dto.name !== undefined) update.name = dto.name.trim()
    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase()
      const dup = await this.userModel.exists({ _id: { $ne: id }, email })
      if (dup) throw new BadRequestException('Email already in use')
      update.email = email
    }
    if (dto.phone !== undefined) update.phone = dto.phone
    if (dto.roles !== undefined) update.roles = dto.roles
    if (dto.status !== undefined) update.status = dto.status
    if (dto.defaultAddressId !== undefined) update.defaultAddressId = dto.defaultAddressId
    if (dto.avatarUrl !== undefined) update.avatarUrl = dto.avatarUrl

    if (dto.password) {
      update.passwordHash = await bcrypt.hash(dto.password, 12)
    }

    const doc = await this.userModel
      .findByIdAndUpdate(this.toId(id), { $set: update }, { new: true })
      .select('-passwordHash')
      .lean()

    if (!doc) throw new NotFoundException('User not found')
    return doc
  }

  async remove(id: string) {
    const doc = await this.userModel
      .findByIdAndUpdate(this.toId(id), { $set: { status: UserStatus.Deleted } }, { new: true })
      .select('-passwordHash')
      .lean()
    if (!doc) throw new NotFoundException('User not found')
    return doc
  }
  async restore(id: string) {
    const doc = await this.userModel
      .findByIdAndUpdate(this.toId(id), { $set: { status: UserStatus.Active } }, { new: true })
      .select('-passwordHash')
      .lean()
    if (!doc) throw new NotFoundException('User not found')
    return doc
  }
  async hardDelete(id: string) {
    const res = await this.userModel.deleteOne({ _id: this.toId(id) })
    if (res.deletedCount === 0) throw new NotFoundException('User not found')
    return { ok: true }
  }
}
