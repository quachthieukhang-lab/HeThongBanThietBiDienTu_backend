import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateReviewDto } from './dto/create-review.dto'
import { UpdateReviewDto } from './dto/update-review.dto'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Review, ReviewStatus } from './schemas/review.schema'
import { Order } from '@orders/schemas/order.schema'
import { Product } from '@products/schemas/product.schema'
import { UploadService } from 'upload/upload.service'
import { UserRole } from '@users/schemas/user.schema'

type UserPayload = { sub: string; email: string; roles: string[] }

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly uploadService: UploadService,
  ) {}

  private async recomputeProductRating(productId: Types.ObjectId) {
    const stats = await this.reviewModel.aggregate([
      { $match: { productId, status: ReviewStatus.Approved } },
      { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ])

    if (stats.length > 0) {
      await this.productModel.findByIdAndUpdate(productId, {
        rating: stats[0].avgRating,
        reviewCount: stats[0].reviewCount,
      })
    } else {
      await this.productModel.findByIdAndUpdate(productId, { rating: 0, reviewCount: 0 })
    }
  }

  async create(dto: CreateReviewDto, user: UserPayload, files?: Express.Multer.File[]) {
    const userId = new Types.ObjectId(user.sub)
    const productId = new Types.ObjectId(dto.productId)

    // 1. Kiểm tra xem user đã mua sản phẩm này chưa
    const order = await this.orderModel.findOne({
      _id: dto.orderId,
      userId,
      'items.productId': productId,
    })
    if (!order) {
      throw new ForbiddenException('You can only review products you have purchased.')
    }

    // 2. Upload ảnh (nếu có)
    const imageUrls = await Promise.all(
      (files || []).map((file) => this.uploadService.saveFile(file, 'reviews')),
    )

    // 3. Tạo review
    try {
      const newReview = await this.reviewModel.create({
        ...dto,
        userId,
        images: imageUrls,
        status: ReviewStatus.Pending, // Mặc định chờ duyệt
      })
      // Không tính lại rating vội, chỉ tính khi review được approved
      return newReview.toObject()
    } catch (error) {
      // Xóa ảnh đã upload nếu tạo review lỗi (ví dụ: đã review sản phẩm này rồi)
      await Promise.all(imageUrls.map((url) => this.uploadService.deleteFile(url)))
      if (error.code === 11000) {
        throw new BadRequestException('You have already reviewed this product.')
      }
      throw error
    }
  }

  async findAll(query: any) {
    const { page = 1, limit = 20, productId, userId, status } = query
    const filter: any = {}
    if (productId) filter.productId = new Types.ObjectId(productId)
    if (userId) filter.userId = new Types.ObjectId(userId)
    if (status) filter.status = status
    else filter.status = ReviewStatus.Approved // Mặc định chỉ lấy review đã duyệt

    const [items, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name avatarUrl') // Lấy thông tin người dùng
        .lean(),
      this.reviewModel.countDocuments(filter),
    ])

    return { items, page, limit, total, pages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const review = await this.reviewModel.findById(id).lean()
    if (!review) throw new NotFoundException('Review not found.')
    return review
  }

  async update(id: string, dto: UpdateReviewDto, user: UserPayload) {
    const review = await this.reviewModel.findById(id)
    if (!review) throw new NotFoundException('Review not found.')

    const isOwner = review.userId.equals(user.sub)
    const isAdminOrStaff = user.roles.some((r) =>
      [UserRole.Admin, UserRole.Staff].includes(r as UserRole),
    )

    if (!isOwner && !isAdminOrStaff) {
      throw new ForbiddenException('You do not have permission to update this review.')
    }

    // Chỉ Admin/Staff mới được đổi status
    if (dto.status && !isAdminOrStaff) {
      throw new ForbiddenException('You do not have permission to change the status.')
    }

    Object.assign(review, dto)
    const updatedReview = await review.save()

    // Tính lại rating sản phẩm sau khi cập nhật
    await this.recomputeProductRating(review.productId)

    return updatedReview.toObject()
  }

  async remove(id: string, user: UserPayload) {
    const review = await this.reviewModel.findById(id)
    if (!review) throw new NotFoundException('Review not found.')

    const isOwner = review.userId.equals(user.sub)
    const isAdminOrStaff = user.roles.some((r) =>
      [UserRole.Admin, UserRole.Staff].includes(r as UserRole),
    )

    if (!isOwner && !isAdminOrStaff) {
      throw new ForbiddenException('You do not have permission to delete this review.')
    }

    await review.deleteOne()
    await this.recomputeProductRating(review.productId)

    return { deleted: true }
  }
}
