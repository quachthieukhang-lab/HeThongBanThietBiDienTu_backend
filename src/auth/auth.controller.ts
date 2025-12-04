// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from '@users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private usersService: UsersService, // Giả sử bạn có UsersService
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  // Passport local: validate -> req.user
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: any, @Body() _dto: LoginDto) {
    return this.auth.login(req.user);
  }

  // Lấy profile nhanh từ access token
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    // req.user là payload của access token
    const userId = req.user.sub;
    const user = await this.usersService.findOne(userId); // Giả sử có phương thức findOne(id)
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user; // Trả về toàn bộ thông tin user, bao gồm cả 'name'
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user.sub; // Lấy userId từ payload của token
    return this.auth.changePassword(userId, dto);
  }

  // refresh: gửi refreshToken qua Cookie/x-refresh-token header/Body.refreshToken
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@Req() req: any) {
    return this.auth.refresh(req.user);
  }


  @Post('logout')
  logout(@Req() req: any) {
    return this.auth.logout(req.user.sub);
  }
}
