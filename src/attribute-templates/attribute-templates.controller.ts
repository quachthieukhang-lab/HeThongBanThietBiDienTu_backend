// src/attribute-templates/attribute-template.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { AttributeTemplateService } from './attribute-templates.service'
import {
  CreateAttributeTemplateDto,
  QueryAttributeTemplateDto,
  UpdateAttributeTemplateDto,
} from './dto/index'

@Controller('attribute-templates')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AttributeTemplateController {
  constructor(private readonly service: AttributeTemplateService) {}

  @Post()
  create(@Body() dto: CreateAttributeTemplateDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll(@Query() q: QueryAttributeTemplateDto) {
    return this.service.findAll(q)
  }

  @Get('active')
  // /attribute-templates/active?subcategoryId=...
  getActive(@Query('subcategoryId') subcategoryId: string) {
    return this.service.getActive(subcategoryId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttributeTemplateDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }

  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.service.activate(id)
  }
}
