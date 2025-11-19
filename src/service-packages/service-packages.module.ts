import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicePackage, ServicePackageSchema } from './schemas/service-package.schema';
import { ServicePackagesService } from './service-packages.service';
import { ServicePackagesController } from './service-packages.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ServicePackage.name, schema: ServicePackageSchema }])],
  controllers: [ServicePackagesController],
  providers: [ServicePackagesService],
  exports: [MongooseModule],
})
export class ServicePackagesModule {}
