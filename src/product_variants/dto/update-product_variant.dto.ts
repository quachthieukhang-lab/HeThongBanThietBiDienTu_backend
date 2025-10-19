import { PartialType } from '@nestjs/mapped-types';
import { CreateVariantDto } from './create-product_variant.dto';

export class UpdateVariantDto extends PartialType(CreateVariantDto) {}
