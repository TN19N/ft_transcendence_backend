import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoginException } from 'src/common/exceptions';

export class JwtGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw new LoginException();
    }
    return super.handleRequest(err, user, info, context);
  }
}
