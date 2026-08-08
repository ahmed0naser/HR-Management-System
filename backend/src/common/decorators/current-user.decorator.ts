import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { payloadType } from '../types/payloadType';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): payloadType => {
    const req: Request = ctx.switchToHttp().getRequest();
    if (!req.user) {
      throw new UnauthorizedException();
    }
    if (!req.user) {
      throw new UnauthorizedException('No authenticated user found on request');
    }
    return req.user;
  },
);
