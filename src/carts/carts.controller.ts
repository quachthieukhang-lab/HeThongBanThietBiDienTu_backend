import { Body, Controller, Get, Post, Patch, Delete, Query, UseGuards } from '@nestjs/common'
import { CartsService } from './carts.service'
import { AddItemDto } from './dto/add-item.dto'
import { SetQtyDto } from './dto/set-qty.dto'
import { RemoveItemDto } from './dto/remove-item.dto'
import { MergeCartDto } from './dto/merge-cart.dto'
import { JwtOptionalAuthGuard } from '@auth/guards/jwt-optional-auth.guard'
import { CurrentUser } from '@auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard'

type UserPayload = { sub: string; email: string; roles: string[] }

@Controller('carts')
export class CartsController {
  constructor(private readonly carts: CartsService) {}

  @Get('me')
  @UseGuards(JwtOptionalAuthGuard)
  getMy(@CurrentUser() user: UserPayload, @Query('sessionId') sessionId?: string) {
    // Nếu user đăng nhập, dùng user.sub (userId). Nếu không, dùng sessionId.
    return this.carts.getMyCart(user?.sub, sessionId)
  }

  @Post('items')
  @UseGuards(JwtOptionalAuthGuard)
  addItem(@CurrentUser() user: UserPayload, @Body() dto: AddItemDto) {
    return this.carts.addItem({ ...dto, userId: user?.sub })
  }

  @Patch('items')
  @UseGuards(JwtOptionalAuthGuard)
  setQty(@CurrentUser() user: UserPayload, @Body() dto: SetQtyDto) {
    return this.carts.setItemQty({ ...dto, userId: user?.sub })
  }

  @Delete('items')
  @UseGuards(JwtOptionalAuthGuard)
  removeItem(@CurrentUser() user: UserPayload, @Body() dto: RemoveItemDto) {
    return this.carts.removeItem({ ...dto, userId: user?.sub })
  }

  @Post('clear')
  @UseGuards(JwtOptionalAuthGuard)
  clear(@CurrentUser() user: UserPayload, @Query('sessionId') sessionId?: string) {
    return this.carts.clearCart(user?.sub, sessionId)
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard) // Yêu cầu đăng nhập bắt buộc
  merge(@CurrentUser() user: UserPayload, @Body() dto: MergeCartDto) {
    // Lấy userId từ token để bảo mật, sessionId từ body
    return this.carts.mergeGuestToUser(dto.sessionId, user.sub)
  }
}
