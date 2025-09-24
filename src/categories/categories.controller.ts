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
} from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
type SortKey = 'name' | 'sortOrder' | '-createdAt'
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto)
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
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto)
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
