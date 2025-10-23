// src/auth/strategies/jwt-refresh.strategy.ts
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
function extractRefreshToken(req: any): string | null {
  return (
    req?.cookies?.refreshToken ||
    req?.headers?.['x-refresh-token'] ||
    req?.body?.refreshToken ||
    null
  )
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshToken]),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    })
  }
  async validate(req: any, payload: any) {
    // Trả kèm token gốc để so sánh hash trong DB
    const token = extractRefreshToken(req)
    return { ...payload, refreshToken: token }
  }
}
