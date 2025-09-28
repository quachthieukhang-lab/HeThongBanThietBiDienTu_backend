import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { BrandsService } from './brands.service'
import { CreateBrandDto } from './dto/create-brand.dto'
import { UpdateBrandDto } from './dto/update-brand.dto'
import { QueryBrandDto } from './dto/query-brand.dto'

@Controller('brands')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll(@Query() q: QueryBrandDto) {
    return this.service.findAll(q)
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
