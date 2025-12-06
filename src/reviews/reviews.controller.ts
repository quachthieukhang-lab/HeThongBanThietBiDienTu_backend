import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { CreateReviewDto } from './dto/create-review.dto'
import { UpdateReviewDto } from './dto/update-review.dto'
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard'
import { RolesGuard } from '@auth/guards/roles.guard'
import { CurrentUser } from '@auth/decorators/current-user.decorator'
import { Roles } from '@auth/decorators/roles.decorator'
import { UserRole } from '@users/schemas/user.schema'
import { FilesInterceptor } from '@nestjs/platform-express'

type UserPayload = { sub: string; email: string; roles: string[] }

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('images', 5)) // Tối đa 5 ảnh
  create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: UserPayload,
    @UploadedFiles()
    files?: Express.Multer.File[],
  ) {
    return this.reviewsService.create(createReviewDto, user, files)
  }

  @Get('product/:productId')
  findAllByProduct(
    @Param('productId') productId: string,
    @Query() query: any,
  ) { return this.reviewsService.findAllByProductId(productId, query) }

  @Get()
  findAll(@Query() query: any) {
    return this.reviewsService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.reviewsService.update(id, updateReviewDto, user)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.reviewsService.remove(id, user)
  }
}
