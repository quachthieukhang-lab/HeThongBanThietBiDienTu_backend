// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import type { StringValue } from 'ms';
import { ConfigService } from '@nestjs/config';
type JwtPayload = { sub: string; email: string; roles: string[] }

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private configService: ConfigService
  ) {}
  private getExpires(v: string | undefined, fallback: StringValue): StringValue {
    return (v ?? fallback) as StringValue;
  }
  /** Xác thực local */
  async validateUser(email: string, pass: string) {
    const user = await this.users.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(pass, user.passwordHash);
    if (!ok) return null;
    // chỉ lấy các field cần
    return {
      _id: String(user._id),
      email: user.email,
      name: user.name,
      roles: user.roles ?? ['customer'],
      status: user.status,
    };
  }

  async register(dto: RegisterDto) {
    const existed = await this.users.findByEmail(dto.email);
    if (existed) throw new BadRequestException('Email already used');
    const hash = await bcrypt.hash(dto.password, 10);
    const created = await this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash: hash,
      phone: dto.phone,
      roles: ['customer'],
    } as any);
    // cấp token ngay sau đăng ký
    const tokens = await this.issueTokens(
      String(created._id),
      created.email,
      created.roles || ['customer'],
    )
    await this.saveRefreshToken(created._id, tokens.refreshToken);
    return { user: { _id: created._id, name: created.name, email: created.email }, ...tokens };
  }

  private async saveRefreshToken(userId: any, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.users.setRefreshToken(String(userId), hash);
  }

  private async verifyStoredRefresh(userId: string, token: string) {
    const user = await this.users.findOne(userId);
    if (!user?.refreshTokenHash) throw new UnauthorizedException('No refresh token');
    const ok = await bcrypt.compare(token, user.refreshTokenHash);
    if (!ok) throw new UnauthorizedException('Invalid refresh token');
    return user;
  }

  private async issueTokens(sub: string, email: string, roles: string[]) {
    const accessPayload: JwtPayload = { sub, email, roles };
    const refreshPayload: JwtPayload = { sub, email, roles };

    const accessExpires = this.getExpires(
      this.configService.get<string>('JWT_ACCESS_EXPIRES'),
      '15m',
    )
    const refreshExpires = this.getExpires(
      this.configService.get<string>('JWT_REFRESH_EXPIRES'),
      '7d',
    )
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: accessSecret!,
        expiresIn: accessExpires, // ms.StringValue
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: refreshSecret!,
        expiresIn: refreshExpires, // ms.StringValue
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /** Đăng nhập: đã qua LocalStrategy => req.user có { _id, email, roles } */
  async login(user: any) {
    const tokens = await this.issueTokens(user._id, user.email, user.roles);
    await this.saveRefreshToken(user._id, tokens.refreshToken);
    return tokens;
  }

  /** /auth/refresh dùng JwtRefreshGuard */
  async refresh(userFromGuard: any) {
    const userId = String(userFromGuard.sub);
    const rawRt = userFromGuard.refreshToken;
    await this.verifyStoredRefresh(userId, rawRt);
    const tokens = await this.issueTokens(userId, userFromGuard.email, userFromGuard.roles || []);
    await this.saveRefreshToken(userId, tokens.refreshToken); // rotate
    return tokens;
  }

  async logout(userId: string) {
    await this.users.setRefreshToken(userId, null);
    return { ok: true };
  }
}
