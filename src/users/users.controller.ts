import {
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  Patch,
  ParseFilePipe,
  Post,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseArrayPipe,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  FileTypeValidator,
} from '@nestjs/common'

import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserRole, UserStatus } from '@users/schemas/user.schema'
import { FindAllQuery } from '@users/dto/find-all-query.dto'
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard'
import { RolesGuard } from '@auth/guards/roles.guard'
import { Roles } from '@auth/decorators/roles.decorator'
import { FileInterceptor } from '@nestjs/platform-express'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.Admin)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto)
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Staff)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
    @Query(
      'roles',
      new DefaultValuePipe([]),
      new ParseArrayPipe({ optional: true, separator: ',', items: String }),
    )
    roles?: UserRole[],
  ) {
    const q: FindAllQuery = { page, limit, search, status, roles }
    return this.usersService.findAll(q)
  }

  @Get('me')
  getProfile(@Req() req) {
    // req.user chứa payload từ JWT (sub: userId)
    return this.usersService.findOne(req.user.sub);
  }

  @Patch('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  updateAvatar(
    @Req() req,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    const userId = req.user.sub;
    return this.usersService.updateAvatar(userId, file);
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Staff)
  findOne(@Param('id') id: string) {
    console.log('users.controller.findOne called', { id })
    return this.usersService.findOne(id)
  }

  @Get('email/:email')
  @Roles(UserRole.Admin, UserRole.Staff)
  findByEmail(@Param('email') email: string) {
    console.log('users.controller.findByEmail called', { email })
    return this.usersService.findByEmail(email)
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto)
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.Staff)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }

  @Post(':id/restore')
  @Roles(UserRole.Admin, UserRole.Staff)
  restore(@Param('id') id: string) {
    return this.usersService.restore(id)
  }

  @Delete(':id/hard')
  @Roles(UserRole.Admin)
  hardDelete(@Param('id') id: string) {
    return this.usersService.hardDelete(id)
  }
}
