import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export class JwtGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw new UnauthorizedException();
    }
    return super.handleRequest(err, user, info, context);
  }
}
