import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { BrandsService } from './brands.service'
import { CreateBrandDto } from './dto/create-brand.dto'
import { UpdateBrandDto } from './dto/update-brand.dto'
import { QueryBrandDto } from './dto/query-brand.dto'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('brands')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BrandsController {
  constructor(private readonly service: BrandsService) { }
  @Post()
  @UseInterceptors(FileInterceptor('logoUrl'))
  async create(
    @Body() createBrandDto: CreateBrandDto,
    // 💡 Nhận toàn bộ file object
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Controller chỉ truyền file object vào Service
    return this.service.create(createBrandDto, file);
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
  @UseInterceptors(FileInterceptor('logoUrl'))
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    // Nhận toàn bộ file object
    @UploadedFile(
      new ParseFilePipe({
        // ... Validation tương tự như create (tùy chọn) ...
        fileIsRequired: false,
      })
    )
    file: Express.Multer.File,
  ) {
    // Controller chỉ truyền file object vào Service
    return this.service.update(id, updateBrandDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
