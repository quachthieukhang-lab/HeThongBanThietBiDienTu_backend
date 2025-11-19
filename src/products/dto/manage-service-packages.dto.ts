import { IsArray, IsMongoId } from 'class-validator'

export class ManageServicePackagesDto {
  @IsArray()
  @IsMongoId({ each: true, message: 'Mỗi phần tử trong mảng phải là một MongoID hợp lệ' })
  servicePackageIds: string[]
}