import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { AddressesService } from './addresses.service'
import { CreateAddressDto } from './dto/create-address.dto'
import { UpdateAddressDto } from './dto/update-address.dto'

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Post()
  create(@Body() dto: CreateAddressDto) {
    return this.addresses.create(dto)
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
    @Query('sort') sort?: '-updatedAt' | 'fullName' | 'city',
  ) {
    return this.addresses.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      userId,
      sort,
    })
  }

  @Get('/by-user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.addresses.findByUser(userId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.addresses.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addresses.update(id, dto)
  }

  @Post(':id/set-default')
  setDefault(@Param('id') id: string) {
    return this.addresses.setDefault(id)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.addresses.remove(id)
  }
}
