import { HttpException } from '@nestjs/common';

export class LoginException extends HttpException {
  constructor() {
    super('Unauthorized', 401);
  }
}
