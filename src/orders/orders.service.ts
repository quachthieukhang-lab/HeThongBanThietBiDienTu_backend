import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Order, OrderStatus } from './schemas/order.schema'
import { Cart } from '@carts/schemas/cart.schema'
import { Address } from '@addresses/schemas/address.schema'
import { ProductVariant } from '@product_variants/schemas/product-variant.schema'
import { UserRole } from '@users/schemas/user.schema'

type UserPayload = { sub: string; email: string; roles: string[] }

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(Address.name) private readonly addressModel: Model<Address>,
    @InjectModel(ProductVariant.name) private readonly variantModel: Model<ProductVariant>,
  ) {}

  async create(dto: CreateOrderDto, user: UserPayload) {
    const userId = new Types.ObjectId(user.sub);

    const [cart, address] = await Promise.all([
      this.cartModel.findOne({ userId, status: 'active' }).exec(),
      this.addressModel.findOne({ _id: dto.addressId, userId }).exec(),
    ]);

    if (!cart || cart.items.length === 0) throw new BadRequestException('Your cart is empty.');
    if (!address) throw new NotFoundException('Address not found or does not belong to you.');

    // 2. Kiểm tra tồn kho và giảm số lượng
    for (const item of cart.items) {
      if (item.variantId) {
        const variant = await this.variantModel.findById(item.variantId);
        if (!variant || variant.stock < item.quantity) {
          throw new BadRequestException(`Product "${item.name}" is out of stock.`);
        }
        variant.stock -= item.quantity;
        await variant.save();
      }
    }
    // 3. Tạo đơn hàng
    const subTotal = cart.totalPrice;
    const shippingFee = 30000;
    const totalPrice = dto.totalPrice ?? subTotal + shippingFee;

    const newOrder = new this.orderModel({
      userId,
      code: `DH-${Date.now()}`,
      // Map items để đảm bảo có servicePackages
      items: cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        thumbnail: item.thumbnail,
        price: item.price,
        quantity: item.quantity,
        servicePackages: item.servicePackages || [], // ĐẢM BẢO COPY SERVICE PACKAGES
        facets: item.facets,
      })),
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        ward: address.ward,
        district: address.district,
        city: address.city,
      },
      subTotal,
      shippingFee,
      totalPrice,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
      promoCode: dto.promoCode || null,
      status: OrderStatus.Processing,
    });

    // Cập nhật cart
    cart.status = 'ordered';
    cart.items = [];
    cart.totalPrice = 0;
    cart.totalQuantity = 0;

    await Promise.all([newOrder.save(), cart.save()]);
    return newOrder.toObject();
  }


  async findAll(user: UserPayload, query: any) {
    const filter: any = {}
    const isCustomer = user.roles.includes(UserRole.Customer)

    // Khách hàng chỉ xem được đơn hàng của mình
    if (isCustomer) {
      filter.userId = new Types.ObjectId(user.sub)
    } else if (query.userId) {
      // Admin/Staff có thể lọc theo userId
      filter.userId = new Types.ObjectId(query.userId)
    }

    // Thêm các filter khác (status, date range,...)
    if (query.status) {
      filter.status = query.status
    }

    return this.orderModel.find(filter).sort({ createdAt: -1 }).lean()
  }

  async findOne(id: string, user: UserPayload) {
    const order = await this.orderModel.findById(id).lean()
    if (!order) {
      throw new NotFoundException('Order not found.')
    }

    // Kiểm tra quyền sở hữu nếu là khách hàng
    if (user.roles.includes(UserRole.Customer) && !order.userId.equals(user.sub)) {
      throw new ForbiddenException('You do not have permission to view this order.')
    }

    return order
  }

  async update(id: string, dto: UpdateOrderDto) {
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .lean()

    if (!updatedOrder) {
      throw new NotFoundException('Order not found.')
    }

    // Thêm logic phức tạp hơn nếu cần, ví dụ:
    // Nếu đơn hàng bị hủy -> hoàn lại stock

    return updatedOrder
  }

  // Xóa đơn hàng thường không được khuyến khích, thay vào đó nên hủy
  async remove(id: string) {
    // Chỉ nên cho phép Admin
    return this.update(id, { status: OrderStatus.Cancelled })
  }
}
