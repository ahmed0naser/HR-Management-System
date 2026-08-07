import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';

import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}
  @Post('/login')
  @UseGuards(AuthGuard('local'))
  async login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, refreshToken } = await this.authService.login(user);
    return this.cookieSetter(token, refreshToken, res);
  }
  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const access_token: string = req.cookies.access_token as string;
    const refresh_token: string = req.cookies.refresh_token as string;

    const { token, refreshToken } = await this.authService.refresh(
      access_token,
      refresh_token,
    );
    return this.cookieSetter(token, refreshToken, res);
  }
  @Post('/logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { status: 'success', message: 'Logged out' };
  }
  @Post('/forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('/reset-password/:token')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Param('token') token: string,
  ) {
    return this.authService.resetPassword(dto, token);
  }

  private cookieSetter(
    access_token: string,
    refresh_token: string,
    res: Response,
  ) {
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
    return { status: 'success' };
  }
}
