import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ServicePackagesService } from './service-packages.service';
import { CreateServicePackageDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';

@Controller('service-packages')
export class ServicePackagesController {
  constructor(private readonly svc: ServicePackagesService) { }

  @Post()
  create(@Body() dto: CreateServicePackageDto) { return this.svc.create(dto); }

  @Get()
  list(@Query('q') q?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.svc.findAll({ q, page: Number(page), limit: Number(limit) });
  }

  @Get(':id')
  get(@Param('id') id: string) { return this.svc.findOne(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServicePackageDto) { return this.svc.update(id, dto); }
  
  @Delete(':id')
  del(@Param('id') id: string) { return this.svc.remove(id); }
}
