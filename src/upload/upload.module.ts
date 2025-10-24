import { Global, Module } from '@nestjs/common';
import { UploadService } from './upload.service';

@Global() // Đánh dấu là module toàn cục
@Module({
  providers: [UploadService],
  exports: [UploadService], // Export service để các module khác có thể inject
})
export class UploadModule {}
