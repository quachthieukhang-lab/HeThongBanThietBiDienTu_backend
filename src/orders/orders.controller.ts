import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard'
import { RolesGuard } from '@auth/guards/roles.guard'
import { CurrentUser } from '@auth/decorators/current-user.decorator'
import { Roles } from '@auth/decorators/roles.decorator'
import { UserRole } from '@users/schemas/user.schema'

type UserPayload = { sub: string; email: string; roles: string[] }

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  // Mọi người dùng đã đăng nhập đều có thể tạo đơn hàng
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: UserPayload) {
    return this.ordersService.create(createOrderDto, user)
  }
  
  @Get()
  // Khách hàng xem đơn hàng của mình, Admin/Staff xem tất cả (hoặc lọc)
  findAll(@CurrentUser() user: UserPayload, @Query() query: any) {
    return this.ordersService.findAll(user, query)
  }

  @Get(':id')
  // Khách hàng xem chi tiết đơn hàng của mình, Admin/Staff xem của bất kỳ ai
  findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.ordersService.findOne(id, user)
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Staff) // Chỉ Admin/Staff được cập nhật đơn hàng
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto)
  }

  @Delete(':id')
  @Roles(UserRole.Admin) // Chỉ Admin được xóa (hủy) đơn hàng
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id)
  }
}
