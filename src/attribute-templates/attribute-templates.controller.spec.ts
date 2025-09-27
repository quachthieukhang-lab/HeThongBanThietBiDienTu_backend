import { Test, TestingModule } from '@nestjs/testing';
import { AttributeTemplatesController } from './attribute-templates.controller';
import { AttributeTemplatesService } from './attribute-templates.service';

describe('AttributeTemplatesController', () => {
  let controller: AttributeTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributeTemplatesController],
      providers: [AttributeTemplatesService],
    }).compile();

    controller = module.get<AttributeTemplatesController>(AttributeTemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
