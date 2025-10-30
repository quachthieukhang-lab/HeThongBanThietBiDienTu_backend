import { Injectable } from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'

@Injectable()
export class JwtOptionalAuthGuard extends JwtAuthGuard {
  // Override handleRequest để không ném lỗi khi không có user
  handleRequest(err, user, info, context) {
    // Không ném lỗi, chỉ trả về user nếu có, hoặc null nếu không
    return user
  }
}
