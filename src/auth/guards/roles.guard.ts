// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@users/schemas/user.schema';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách roles yêu cầu từ @Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // Ưu tiên metadata ở handler (method)
      context.getClass(),   // Nếu không có thì lấy ở class (controller)
    ]);

    // Nếu route không yêu cầu role nào (@Roles không được dùng), cho phép truy cập
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Lấy thông tin user từ request (đã được JwtAuthGuard xử lý và gắn vào)
    const { user } = context.switchToHttp().getRequest();

    // Nếu không có user (chưa đăng nhập) hoặc user không có roles, từ chối
    if (!user || !user.roles) {
      return false;
    }

    // Kiểm tra xem user có ít nhất một role trong danh sách requiredRoles không
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}