// src/categories/subcategories.controller.ts
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { SubcategoriesService } from './subcategories.service'
import { CreateSubcategoryDto } from './dto/create-subcategory.dto'
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto'
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard'
import { RolesGuard } from '@auth/guards/roles.guard'
import { Roles } from '@auth/decorators/roles.decorator'
import { UserRole } from '@users/schemas/user.schema'
import { FileFieldsInterceptor } from '@nestjs/platform-express'

type SortKey = 'name' | 'sortOrder' | '-createdAt'

@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]))
  create(
    @Body() dto: CreateSubcategoryDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[], banner?: Express.Multer.File[] },
  ) {
    const imageFile = files?.image?.[0]
    const bannerFile = files?.banner?.[0]
    return this.subcategoriesService.create(dto, {
      image: imageFile,
      banner: bannerFile,
    })
  }

  
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(300), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sort', new DefaultValuePipe('-createdAt')) sort?: SortKey,
  ) {
    return this.subcategoriesService.findAll({ page, limit, search, isActive, categoryId, sort })
  }

  @Get('simple')
  findAllSimple(
    @Query('isActive', new DefaultValuePipe(true), ParseBoolPipe)
    isActive: boolean,
  ) {
    return this.subcategoriesService.findAllSimple({ isActive });
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
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubcategoryDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[], banner?: Express.Multer.File[] },
  ) {
    const imageFile = files?.image?.[0]
    const bannerFile = files?.banner?.[0]
    return this.subcategoriesService.update(id, dto, {
      image: imageFile,
      banner: bannerFile,
    })
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
