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
  UseGuards,
} from '@nestjs/common'
import { SubcategoriesService } from './subcategories.service'
import { CreateSubcategoryDto } from './dto/create-subcategory.dto'
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto'
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard'
import { RolesGuard } from '@auth/guards/roles.guard'
import { Roles } from '@auth/decorators/roles.decorator'
import { UserRole } from '@users/schemas/user.schema'

type SortKey = 'name' | 'sortOrder' | '-createdAt'

@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Post()
  create(@Body() dto: CreateSubcategoryDto) {
    return this.subcategoriesService.create(dto)
  }
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.subcategoriesService.update(id, dto)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.subcategoriesService.deactivate(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Post(':id/active')
  activate(@Param('id') id: string) {
    return this.subcategoriesService.activate(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Delete(':id/hard')
  removeHard(@Param('id') id: string) {
    return this.subcategoriesService.removeHard(id)
  }
}
