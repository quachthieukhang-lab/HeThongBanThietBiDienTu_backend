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
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { BrandsService } from './brands.service'
import { CreateBrandDto } from './dto/create-brand.dto'
import { UpdateBrandDto } from './dto/update-brand.dto'
import { QueryBrandDto } from './dto/query-brand.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard'
import { RolesGuard } from '@auth/guards/roles.guard'
import { Roles } from '@auth/decorators/roles.decorator'
import { UserRole } from '@users/schemas/user.schema'

@Controller('brands')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BrandsController {
  constructor(private readonly service: BrandsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @UseInterceptors(FileInterceptor('logoUrl'))
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp|svg)' }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @UseInterceptors(FileInterceptor('logoUrl'))
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    // Controller chỉ truyền file object vào Service
    return this.service.update(id, updateBrandDto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
