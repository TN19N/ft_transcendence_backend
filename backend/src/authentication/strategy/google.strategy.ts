import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authenticationService: AuthenticationService,
    configurationService: ConfigurationService,
  ) {
    super({
      clientID: configurationService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configurationService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configurationService.get('GOOGLE_CALLBACK_URL'),
      scope: ['profile'],
    });
  }

  async validate(_unused1: string, _unused2: string, profile: any) {
    console.log(profile);
    return this.authenticationService.validateGoogleUser(profile);
  }
}
