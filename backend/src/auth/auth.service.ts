import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { payloadType } from 'src/common/types/payloadType';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/users/entities/refreshToken.entity';
import { MoreThan, Repository } from 'typeorm';
import { MailService } from 'src/Mail/mail.service';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { LoginAttempt } from './entities/login-attempt.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @InjectRepository(RefreshToken)
    private readonly tokenRepo: Repository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepo: Repository<LoginAttempt>,
  ) {}
  async logger(ip: string | undefined, email: string, success: boolean) {
    const logged = {
      ip,
      email,
      success,
    };
    await this.loginAttemptRepo.save(logged);
  }
  async validateUser(email: string, pass: string, ip: string | undefined) {
    try {
      const user = await this.userService.findByEmail(email);
      const passed = await bcrypt.compare(pass, user.password);
      if (!passed) throw new UnauthorizedException();
      await this.logger(ip, email, true);

      return {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (e) {
      console.log(e);
      await this.logger(ip, email, false);
      throw new UnauthorizedException('wrong credentials');
    }
  }
  async login(user: payloadType) {
    const { sub: id, email, role } = user;
    const { token, refreshToken } = await this.res({ id, email, role });

    return {
      token,
      refreshToken,
    };
  }

  async refresh(accessToken: string, rawRefreshToken: string) {
    const decoded: payloadType = this.jwtService.decode(accessToken);
    if (!decoded?.sub) throw new UnauthorizedException('invalid token');

    const candidates = await this.tokenRepo.find({
      where: {
        user: { id: decoded.sub },
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: { user: true },
    });

    for (const candidate of candidates) {
      const matched = await bcrypt.compare(
        rawRefreshToken,
        candidate.tokenHash,
      );
      if (matched) {
        const user = await this.userService.findOne(decoded.sub);
        candidate.revoked = true;
        await this.tokenRepo.save(candidate);
        return await this.res(user);
      }
    }
    throw new UnauthorizedException('session expired');
  }
  async logout(id: string) {
    const candidates = await this.tokenRepo.find({
      where: {
        user: { id },
        revoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: { user: true },
    });

    for (const candidate of candidates) {
      candidate.revoked = true;
      await this.tokenRepo.save(candidate);
    }
  }
  async forgotPassword(email: string) {
    let user: User;
    try {
      user = await this.userService.findByEmail(email);
    } catch (e) {
      return;
    }
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetTokenHash = await bcrypt.hash(passwordResetToken, 10);
    user.passwordResetTokenHash = passwordResetTokenHash;
    user.passwordResetTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await this.userRepo.save(user);
    const resetLink = `http://localhost:${process.env.PORT}/api/v1/auth/reset-password/${passwordResetToken}.${user.id}`;
    await this.mailService.sendResetPasswordEmail(email, resetLink);
    return { status: 'success', message: 'please check your inbox' };
  }
  async resetPassword(body: ResetPasswordDto, param: string) {
    const [token, id] = param.split('.');
    let user: User;
    try {
      user = await this.userService.findOne(id);
    } catch {
      throw new BadRequestException('invalid or expired reset link');
    }
    if (
      user.passwordResetTokenExpiry !== null &&
      user.passwordResetTokenExpiry < new Date(Date.now())
    ) {
      throw new UnauthorizedException();
    }
    if (!user.passwordResetTokenHash) {
      throw new BadRequestException();
    }
    const isMatched = await bcrypt.compare(token, user.passwordResetTokenHash);
    if (!isMatched) {
      throw new BadRequestException();
    }
    const { newPassword, confirmNewPassword } = body;
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('please confirm password correctly');
    }
    user.passwordResetTokenExpiry = null;
    user.passwordResetTokenHash = null;
    const newPasswordHashed = await bcrypt.hash(newPassword, 10);
    user.password = newPasswordHashed;
    await this.userRepo.save(user);
    return { status: 'success', message: 'password reset successfully' };
  }
  private async res(user: Pick<User, 'id' | 'email' | 'role'>) {
    const payload: payloadType = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const newToken = this.tokenRepo.create({
      tokenHash,
      user: { id: user.id } as User,
      expiresAt,
    });

    await this.tokenRepo.save(newToken);

    return { token, refreshToken };
  }
}
