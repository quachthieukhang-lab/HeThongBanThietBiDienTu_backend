// src/attribute-templates/attribute-template.module.ts
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { AttributeTemplate, AttributeTemplateSchema } from './schemas/attribute-template.schema'
import { AttributeTemplateService } from './attribute-templates.service'
import { AttributeTemplateController } from './attribute-templates.controller'
import { Subcategory, SubcategorySchema } from '@subcategories/schemas/subcategory.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AttributeTemplate.name, schema: AttributeTemplateSchema },
      { name: Subcategory.name, schema: SubcategorySchema },
    ]),
  ],
  controllers: [AttributeTemplateController],
  providers: [AttributeTemplateService],
  exports: [AttributeTemplateService],
})
export class AttributeTemplatesModule {}
