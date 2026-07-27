import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  async validateUser(email: string, pass: string) {
    try {
      const user = await this.userService.findByEmail(email);
      const passed = await bcrypt.compare(pass, user.password);
      if (!passed) throw new UnauthorizedException();
      const { password, ...cleanUser } = user;
      return cleanUser;
    } catch (e) {
      console.log(e);

      throw new UnauthorizedException('wrong credentials');
    }
  }
  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);
    return {
      status: 'success',
      message: 'You are successfully logged in',
      token,
    };
  }
}
