import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // Passport defaults to "username", we override to "email"
  }

  async validate(email: string, password: string) {
    // this is where YOUR logic goes — check email/password against the DB
    return this.authService.validateUser(email, password);
  }
}
