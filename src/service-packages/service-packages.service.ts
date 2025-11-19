import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServicePackage, ServicePackageDocument } from './schemas/service-package.schema';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';

@Injectable()
export class ServicePackagesService {
  constructor(
    @InjectModel(ServicePackage.name)
    private readonly spModel: Model<ServicePackageDocument>,
  ) {}

  create(dto: CreateServicePackageDto) {
    return this.spModel.create(dto);
  }

  findAll({ q, page = 1, limit = 20 }: { q?: string; page?: number; limit?: number }) {
    const filter: any = {};
    if (q) filter.name = new RegExp(q.trim(), 'i');
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    return this.spModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  }

  async findOne(id: string) {
    const doc = await this.spModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Service package not found');
    return doc;
  }

  update(id: string, dto: UpdateServicePackageDto) {
    return this.spModel.findByIdAndUpdate(id, dto, { new: true }).lean();
  }

  remove(id: string) {
    return this.spModel.findByIdAndDelete(id).lean();
  }
}