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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from '../product_variants/dto/create-product_variant.dto';
import { UpdateVariantDto } from '../product_variants/dto/update-product_variant.dto';
import { QueryProductsDto } from './dto/query-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // Products
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.createProduct(dto);
  }

  @Get()
  findAll(
    @Query(new DefaultValuePipe({ page:1, limit:20 })) query: QueryProductsDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) _p?: number, // giữ để Nest parse đúng
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) _l?: number,
  ) {
    return this.products.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.updateProduct(id, dto);
  }

  @Delete(':id')
  removeHard(@Param('id') id: string) {
    return this.products.removeHard(id);
  }

  // Variants (nested under product)
  @Post(':productId/variants')
  createVariant(@Param('productId') productId: string, @Body() dto: CreateVariantDto) {
    return this.products.createVariant(productId, dto);
  }

  @Get(':productId/variants')
  listVariants(@Param('productId') productId: string) {
    return this.products.listVariants(productId);
  }

  @Patch(':productId/variants/:variantId')
  updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.products.updateVariant(productId, variantId, dto);
  }

  @Delete(':productId/variants/:variantId')
  removeVariant(@Param('productId') productId: string, @Param('variantId') variantId: string) {
    return this.products.removeVariant(productId, variantId);
  }
}
