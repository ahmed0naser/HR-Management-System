import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { payloadType } from 'src/common/types/payloadType';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/users/entities/refreshToken.entity';
import { MoreThan, Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly tokenRepo: Repository<RefreshToken>,
  ) {}
  async validateUser(email: string, pass: string) {
    try {
      const user = await this.userService.findByEmail(email);
      const passed = await bcrypt.compare(pass, user.password);
      if (!passed) throw new UnauthorizedException();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...cleanUser } = user;
      return cleanUser;
    } catch (e) {
      console.log(e);

      throw new UnauthorizedException('wrong credentials');
    }
  }
  async login(user: User) {
    const { token, refreshToken } = await this.res(user);

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
  private async res(user: User) {
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
    const refreshTokenObj = {
      tokenHash,
      user,
      expiresAt,
    };
    await this.tokenRepo.save(refreshTokenObj);
    return { token, refreshToken };
  }
}
