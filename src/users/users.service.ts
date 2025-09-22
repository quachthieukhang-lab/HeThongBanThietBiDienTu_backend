import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { User, UserRole, UserStatus } from '@users/schemas/user.schema';
import * as bcrypt from 'bcrypt';
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
  findAll() {
    return `This action returns all users`;
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
