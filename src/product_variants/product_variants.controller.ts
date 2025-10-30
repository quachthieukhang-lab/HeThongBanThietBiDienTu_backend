import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductVariantsService } from './product_variants.service';
import { CreateVariantDto } from './dto/create-product_variant.dto';
import { UpdateVariantDto } from './dto/update-product_variant.dto';
import { QueryVariantsDto } from './dto/query-product_variant.dto';

@Controller('product-variants')
export class ProductVariantsController {
  constructor(private readonly variants: ProductVariantsService) {}

  @Post()
  create(@Body() dto: CreateVariantDto) {
    return this.variants.create(dto);
  }

  @Get()
  findAll(
    @Query(new DefaultValuePipe({ page:1, limit:20 })) query: QueryVariantsDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) _p?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) _l?: number,
  ) {
    return this.variants.findAll(query);
  }

  @Get('/by-product/:productId')
  findByProduct(
    @Param('productId') productId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.variants.findAll({ productId, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.variants.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.variants.update(id, dto)
  }

  @Patch(':id/active')
  setActive(@Param('id') id: string, @Query('value', new DefaultValuePipe('true')) value: string) {
    return this.variants.setActive(id, value === 'true')
  }

  @Patch(':id/stock')
  adjustStock(
    @Param('id') id: string,
    @Query('delta', new DefaultValuePipe(0), ParseIntPipe) delta: number,
  ) {
    return this.variants.adjustStock(id, delta);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.variants.remove(id);
  }
}
