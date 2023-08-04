import { HttpException } from '@nestjs/common';

export class LoginException extends HttpException {
  constructor() {
    super('Login failed', 401);
  }
}
