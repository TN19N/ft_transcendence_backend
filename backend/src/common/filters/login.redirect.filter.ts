import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { LoginException } from '../exceptions';

@Catch(LoginException)
export class LoginRedirectFilter implements ExceptionFilter {
  constructor(private configurationService: ConfigurationService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response
      .status(status)
      .redirect(this.configurationService.get('FRONTEND_URL') + '/login');
  }
}
