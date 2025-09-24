import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseArrayPipe,
} from '@nestjs/common'

import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserRole, UserStatus } from '@users/schemas/user.schema'
import { FindAllQuery } from '@users/dto/find-all-query.dto'
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto)
  }

  @Get()
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('users.controller.findOne called', { id })
    return this.usersService.findOne(id)
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    console.log('users.controller.findByEmail called', { email })
    return this.usersService.findByEmail(email)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id)
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id)
  }

  @Delete(':id/hard')
  hardDelete(@Param('id') id: string) {
    return this.usersService.hardDelete(id)
  }

}
