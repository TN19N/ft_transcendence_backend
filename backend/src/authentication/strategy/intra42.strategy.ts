import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Strategy } from 'passport-42';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class Intra42Strategy extends PassportStrategy(Strategy, 'intra42') {
  constructor(
    private authenticationService: AuthenticationService,
    configurationService: ConfigurationService,
  ) {
    super({
      clientID: configurationService.get('INTRA42_CLIENT_ID'),
      clientSecret: configurationService.get('INTRA42_CLIENT_SECRET'),
      callbackURL: configurationService.get('INTRA42_CALLBACK_URL'),
      scope: 'public',
    });
  }

  async validate(
    _unused1: string,
    _unused2: string,
    profile: any,
  ): Promise<User> {
    return this.authenticationService.validateIntra42User(profile);
  }
}
