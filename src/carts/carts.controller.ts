import { Body, Controller, Get, Post, Patch, Delete, Query } from '@nestjs/common'
import { CartsService } from './carts.service'
import { AddItemDto } from './dto/add-item.dto'
import { SetQtyDto } from './dto/set-qty.dto'
import { RemoveItemDto } from './dto/remove-item.dto'
import { ClearCartDto } from './dto/clear-cart.dto'
import { MergeCartDto } from './dto/merge-cart.dto'

@Controller('carts')
export class CartsController {
  constructor(private readonly carts: CartsService) {}

  // GET /carts/me?sessionId=...
  @Get('me')
  getMy(@Query('userId') userId?: string, @Query('sessionId') sessionId?: string) {
    // Nếu dùng JWT: lấy userId từ req.user.id và bỏ query userId
    return this.carts.getMyCart(userId, sessionId)
  }

  // POST /carts/items
  @Post('items')
  addItem(@Body() dto: AddItemDto, @Query('userId') userId?: string) {
    return this.carts.addItem({ ...dto, userId })
  }

  // PATCH /carts/items
  @Patch('items')
  setQty(@Body() dto: SetQtyDto, @Query('userId') userId?: string) {
    return this.carts.setItemQty({ ...dto, userId })
  }

  // DELETE /carts/items
  @Delete('items')
  removeItem(@Body() dto: RemoveItemDto, @Query('userId') userId?: string) {
    return this.carts.removeItem({ ...dto, userId })
  }

  // POST /carts/clear
  @Post('clear')
  clear(@Body() dto: ClearCartDto, @Query('userId') userId?: string) {
    return this.carts.clearCart(userId, dto.sessionId)
  }

  // POST /carts/merge
  @Post('merge')
  merge(@Body() dto: MergeCartDto) {
    return this.carts.mergeGuestToUser(dto.sessionId, dto.userId)
  }
}
