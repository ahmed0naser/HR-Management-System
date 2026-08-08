import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
@Injectable()
export class SelfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();
    if (!req.user) {
      throw new UnauthorizedException();
    }
    if (req.user.sub === req.params.id) {
      return true;
    }
    throw new ForbiddenException();
  }
}
