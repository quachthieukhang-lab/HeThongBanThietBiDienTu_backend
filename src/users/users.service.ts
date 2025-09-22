import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { User, UserRole, UserStatus } from '@users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { FindAllQuery } from '@users/dto/find-all-query.dto';
@Injectable()


export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) { }
  
  async create(dto: CreateUserDto) {
    // Email duy nhất
    const existed = await this.userModel.exists({ email: dto.email.toLowerCase() });
    if (existed) throw new BadRequestException('Email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const doc = await this.userModel.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase(),
      passwordHash,
      phone: dto.phone ?? null,
      roles: dto.roles?.length ? dto.roles : [UserRole.Customer],
      status: dto.status ?? UserStatus.Active,
      defaultAddressId: dto.defaultAddressId ?? null,
      avatarUrl: dto.avatarUrl ?? null,
    });

    // .toObject() để strip getters; ẩn passwordHash
    return this.toSafe(doc.toObject());
  }
  private toSafe(user: any) {
    if (!user) return user;
    const { passwordHash, __v, ...rest } = user;
    return rest;
  }
  async findAll(q: FindAllQuery = {}) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (q.status) filter.status = q.status;
    if (q.roles?.length) filter.roles = { $in: q.roles };
    if (q.search) {
      const s = q.search.trim();
      filter.$or = [
        { name: new RegExp(s, 'i') },
        { email: new RegExp(s, 'i') },
        { phone: new RegExp(s, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-passwordHash')     // ẩn pass
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
