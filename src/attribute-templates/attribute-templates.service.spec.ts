import { Test, TestingModule } from '@nestjs/testing';
import { AttributeTemplatesService } from './attribute-templates.service';

describe('AttributeTemplatesService', () => {
  let service: AttributeTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttributeTemplatesService],
    }).compile();

    service = module.get<AttributeTemplatesService>(AttributeTemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
