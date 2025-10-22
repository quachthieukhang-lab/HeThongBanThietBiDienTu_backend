// src/auth/auth.module.ts
import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { LocalStrategy } from './strategies/local.strategy'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: false }),
    JwtModule.register({}), // secrets/exp in AuthService
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
