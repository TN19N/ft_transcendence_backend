import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigurationService } from 'src/configuration/configuration.service';

@Catch(UnauthorizedException)
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
