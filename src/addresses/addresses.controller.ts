import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AddressesService } from './addresses.service'
import { CreateAddressDto } from './dto/create-address.dto'
import { UpdateAddressDto } from './dto/update-address.dto'
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard'
import { RolesGuard } from '@auth/guards/roles.guard'
import { Roles } from '@auth/decorators/roles.decorator'
import { UserRole } from '@users/schemas/user.schema'
import { CurrentUser } from '@auth/decorators/current-user.decorator'

type UserPayload = { sub: string; email: string; roles: string[] }

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Post()
  // Mọi người dùng đã đăng nhập đều có thể tạo địa chỉ cho chính mình
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateAddressDto) {
    // Ghi đè userId từ token để đảm bảo bảo mật
    return this.addresses.create({ ...dto, userId: user.sub })
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Staff)
  findAll(@Query() params: any) {
    const { page, limit, search, userId, sort } = params
    return this.addresses.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      userId,
      sort,
    })
  }

  @Get('/by-user/:userId')
  @Roles(UserRole.Admin, UserRole.Staff)
  findByUser(@Param('userId') userId: string) {
    return this.addresses.findByUser(userId)
  }

  @Get('/me')
  myAddresses(@CurrentUser() user: UserPayload) {
    return this.addresses.findByUser(user.sub)
  }

  @Get(':id')
  // Người dùng có thể xem địa chỉ của chính mình, Admin/Staff có thể xem của bất kỳ ai
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    // Logic kiểm tra quyền sở hữu nên được đặt trong service hoặc một Guard riêng
    return this.addresses.findOne(id, user)
  }

  @Patch(':id')
  // Người dùng có thể sửa địa chỉ của chính mình, Admin/Staff có thể sửa của bất kỳ ai
  update(@Param('id') id: string, @Body() dto: UpdateAddressDto, @CurrentUser() user: UserPayload) {
    // Logic kiểm tra quyền sở hữu nên được đặt trong service hoặc một Guard riêng
    return this.addresses.update(id, dto, user)
  }

  @Post(':id/set-default')
  setDefault(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.addresses.setDefault(id, user)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.addresses.remove(id, user)
  }
}
