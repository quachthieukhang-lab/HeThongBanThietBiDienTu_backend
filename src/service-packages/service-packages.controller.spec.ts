import { Test, TestingModule } from '@nestjs/testing';
import { ServicePackagesController } from './service-packages.controller';
import { ServicePackagesService } from './service-packages.service';

describe('ServicePackagesController', () => {
  let controller: ServicePackagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicePackagesController],
      providers: [ServicePackagesService],
    }).compile();

    controller = module.get<ServicePackagesController>(ServicePackagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
