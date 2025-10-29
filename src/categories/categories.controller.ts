import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard'
import { RolesGuard } from '@auth/guards/roles.guard'
import { Roles } from '@auth/decorators/roles.decorator'
import { UserRole } from '@users/schemas/user.schema'
type SortKey = 'name' | 'sortOrder' | '-createdAt'
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ) {
    const imageFile = files?.image?.[0]
    const bannerFile = files?.banner?.[0]
    return this.categoriesService.create(createCategoryDto, imageFile, bannerFile)
  }
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string, // 'true' | 'false' | undefined
    @Query('sort', new DefaultValuePipe('-createdAt')) sort?: SortKey,
  ) {
    return this.categoriesService.findAll({ page, limit, search, isActive, sort })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; banner?: Express.Multer.File[] },
  ) {
    const imageFile = files?.image?.[0]
    const bannerFile = files?.banner?.[0]
    return this.categoriesService.update(id, updateCategoryDto, imageFile, bannerFile)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.categoriesService.deactivate(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Post(':id/active')
  activate(@Param('id') id: string) {
    return this.categoriesService.active(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @Delete(':id/hard')
  removeHard(@Param('id') id: string) {
    return this.categoriesService.removeHard(id)
  }
}
