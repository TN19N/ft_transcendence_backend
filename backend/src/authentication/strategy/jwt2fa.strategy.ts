import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { JwtPayload } from '../interface';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class Jwt2faStrategy extends PassportStrategy(Strategy, 'jwt2fa') {
  constructor(
    configurationService: ConfigurationService,
    private authenticationService: AuthenticationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          return request?.cookies?.Authentication;
        },
      ]),
      secretOrKey: configurationService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.tfa == true) {
      return await this.authenticationService.validateJwt(payload);
    } else {
      return null;
    }
  }
}
