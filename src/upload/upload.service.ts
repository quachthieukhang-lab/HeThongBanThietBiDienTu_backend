import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export type UploadDestination = 'brands' | 'products' | 'avatars' | 'general';

@Injectable()
export class UploadService {
  /**
   * Lưu file vào ổ đĩa và trả về đường dẫn tương đối.
   * @param file File object từ Multer
   * @param destination Thư mục con trong 'public/uploads/'
   * @returns Đường dẫn tương đối của file đã lưu (ví dụ: 'uploads/brands/filename.jpg')
   */
  async saveFile(file: Express.Multer.File, destination: UploadDestination): Promise<string> {
    const uploadDir = join(process.cwd(), 'public', 'uploads', destination);
    await fs.mkdir(uploadDir, { recursive: true });

    const fileExtension = extname(file.originalname);
    const uniqueFileName = `${Date.now()}-${uuidv4()}`;
    const fullPath = join(uploadDir, uniqueFileName);

    await fs.writeFile(fullPath, file.buffer);

    // Trả về đường dẫn không bao gồm 'public' để dễ dàng phục vụ file tĩnh
    return `uploads//`;
  }

  /**
   * Xóa file khỏi ổ đĩa.
   * @param relativePath Đường dẫn tương đối của file (ví dụ: 'uploads/brands/filename.jpg')
   */
  async deleteFile(relativePath: string | undefined | null): Promise<void> {
    if (!relativePath) {
      return;
    }
    try {
      const fullPath = join(process.cwd(), 'public', relativePath);
      await fs.unlink(fullPath);
    } catch (error) {
      // Bỏ qua lỗi nếu file không tồn tại
      if (error.code !== 'ENOENT') {
        console.error(`Error deleting file :`, error);
      }
    }
  }
}
