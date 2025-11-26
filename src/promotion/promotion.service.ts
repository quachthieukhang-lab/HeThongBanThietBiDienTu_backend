import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePromotionDto } from '@promotion/dto/create-promotion.dto';
import { UpdatePromotionDto } from '@promotion/dto/update-promotion.dto';
import { Promotion, PromotionDocument } from '@promotion/schemas/promotion.schema';

@Injectable()
export class PromotionService {
  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<PromotionDocument>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    const createdPromotion = new this.promotionModel(createPromotionDto);
    return createdPromotion.save();
  }

  async findAll(): Promise<Promotion[]> {
    return this.promotionModel.find().exec();
  }

  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.promotionModel.findById(id).exec();
    if (!promotion) {
      throw new NotFoundException(`Promotion with ID "${id}" not found`);
    }
    return promotion;
  }

  async update(
    id: string,
    updatePromotionDto: UpdatePromotionDto,
  ): Promise<Promotion> {
    const existingPromotion = await this.promotionModel
      .findByIdAndUpdate(id, updatePromotionDto, { new: true })
      .exec();
    if (!existingPromotion) {
      throw new NotFoundException(`Promotion with ID "${id}" not found`);
    }
    return existingPromotion;
  }

  async remove(id: string): Promise<any> {
    const deletedPromotion = await this.promotionModel.findByIdAndDelete(id);
    if (!deletedPromotion) {
      throw new NotFoundException(`Promotion with ID "${id}" not found`);
    }
    return deletedPromotion;
  }
}

