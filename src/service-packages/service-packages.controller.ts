import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ServicePackagesService } from './service-packages.service';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import { UserRole } from '@users/schemas/user.schema';

@Controller('service-packages')
export class ServicePackagesController {
  constructor(private readonly svc: ServicePackagesService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Post()
  create(@Body() dto: CreateServicePackageDto) { return this.svc.create(dto); }

  @Get()
  list(@Query('q') q?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.findAll({ q, page: Number(page), limit: Number(limit) });
  }

  @Get(':id')
  get(@Param('id') id: string) { return this.svc.findOne(id); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServicePackageDto) { return this.svc.update(id, dto); }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin, UserRole.Staff)
  @Delete(':id')
  del(@Param('id') id: string) { return this.svc.remove(id); }
}
