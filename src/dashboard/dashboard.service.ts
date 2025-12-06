import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus } from '../orders/schemas/order.schema';
import { Product } from '../products/schemas/product.schema';
import { ProductVariant } from '../product_variants/schemas/product-variant.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(ProductVariant.name) private readonly variantModel: Model<ProductVariant>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Lấy 7 ngày gần nhất (tính cả hôm nay)

    const [
      revenueStats,
      orderTodayStats,
      lowStockCount,
      totalProducts,
      totalUsers,
      revenueChartData,
      orderStatusStats
    ] = await Promise.all([
      // 1. Tổng doanh thu (Chỉ tính đơn đã hoàn thành/Delivered)
      this.orderModel.aggregate([
        { $match: { status: OrderStatus.Delivered } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),

      // 2. Đơn hàng hôm nay & Đơn chờ xử lý hôm nay
      this.orderModel.aggregate([
        { $match: { createdAt: { $gte: todayStart } } },
        {
          $group: {
            _id: null,
            totalToday: { $sum: 1 },
            pendingToday: {
              $sum: { $cond: [{ $eq: ['$status', OrderStatus.Pending] }, 1, 0] }
            }
          }
        }
      ]),

      // 3a. Số lượng biến thể sắp hết hàng (ví dụ: < 5)
      this.variantModel.countDocuments({ stock: { $lte: 5 }, isActive: true }),

      // 3b. Tổng số sản phẩm (đang kinh doanh)
      this.productModel.countDocuments({ isPublished: true }),

      // 4. Tổng người dùng (Tài khoản)
      this.userModel.countDocuments({}), // Đếm tất cả, hoặc thêm filter { roles: 'customer' } nếu cần

      // 5. Biểu đồ doanh thu 7 ngày (nhóm theo ngày)
      this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
            status: OrderStatus.Delivered // Chỉ tính doanh thu thực nhận
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 6. Trạng thái đơn hàng (Pie chart)
      this.orderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // --- Xử lý dữ liệu trả về ---

    // 1. Tổng doanh thu
    const totalRevenue = revenueStats[0]?.total || 0;

    // 2. Đơn hôm nay
    const todayData = orderTodayStats[0] || { totalToday: 0, pendingToday: 0 };

    // 5. Fill đầy đủ 7 ngày cho biểu đồ (nếu ngày đó không có đơn thì doanh thu = 0)
    const filledChartData: { date: string; revenue: number; orders: number }[] =
      [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const found = revenueChartData.find(item => item._id === dateStr);
      filledChartData.push({
        date: dateStr, // 30-11, 01-12...
        revenue: found ? found.revenue : 0,
        orders: found ? found.count : 0
      });
    }

    return {
      totalRevenue,
      ordersToday: {
        count: todayData.totalToday,
        pending: todayData.pendingToday,
      },
      inventory: {
        lowStock: lowStockCount,
        totalProducts,
      },
      users: {
        total: totalUsers,
      },
      revenueChart: filledChartData,
      orderStatus: orderStatusStats.map(s => ({ status: s._id, count: s.count })),
    };
  }
}