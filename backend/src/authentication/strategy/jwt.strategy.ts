import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { JwtPayload } from '../interface';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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
    return await this.authenticationService.validateJwt(payload);
  }
}
