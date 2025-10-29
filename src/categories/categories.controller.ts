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
} from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
type SortKey = 'name' | 'sortOrder' | '-createdAt'
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

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

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.categoriesService.deactivate(id)
  }

  @Post(':id/active')
  activate(@Param('id') id: string) {
    return this.categoriesService.active(id)
  }
  @Delete(':id/hard')
  removeHard(@Param('id') id: string) {
    return this.categoriesService.removeHard(id)
  }
}
