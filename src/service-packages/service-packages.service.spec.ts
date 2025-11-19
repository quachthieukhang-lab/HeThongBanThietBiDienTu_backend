import { Test, TestingModule } from '@nestjs/testing';
import { ServicePackagesService } from './service-packages.service';

describe('ServicePackagesService', () => {
  let service: ServicePackagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicePackagesService],
    }).compile();

    service = module.get<ServicePackagesService>(ServicePackagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
