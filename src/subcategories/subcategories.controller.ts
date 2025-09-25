// src/categories/subcategories.controller.ts
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
} from '@nestjs/common'
import { SubcategoriesService } from './subcategories.service'
import { CreateSubcategoryDto } from './dto/create-subcategory.dto'
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto'

type SortKey = 'name' | 'sortOrder' | '-createdAt'

@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) { }

  @Post()
  create(@Body() dto: CreateSubcategoryDto) {
    return this.subcategoriesService.create(dto)
  }

  /**
   * GET /subcategories?page=1&limit=20&search=phone&isActive=true&categoryId=...&sort=name
   */
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sort', new DefaultValuePipe('-createdAt')) sort?: SortKey,
  ) {
    return this.subcategoriesService.findAll({ page, limit, search, isActive, categoryId, sort })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subcategoriesService.findOne(id)
  }
  
  @Get('/by-category/:categoryId')
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('includeInactive') includeInactive?: 'true' | 'false',
    @Query('sort') sort?: 'name' | 'sortOrder' | '-createdAt',
  ) {
    return this.subcategoriesService.findByCategoryId(categoryId, {
      includeInactive: includeInactive === 'true',
      sort,
    })
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.subcategoriesService.update(id, dto)
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.subcategoriesService.deactivate(id)
  }
  @Post(':id/active')
  activate(@Param('id') id: string) {
    return this.subcategoriesService.activate(id)
  }
  @Delete(':id/hard')
  removeHard(@Param('id') id: string) {
    return this.subcategoriesService.removeHard(id)
  }
}
