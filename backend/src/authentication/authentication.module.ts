import { Module, forwardRef } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { ConfigurationModule } from 'src/configuration/configuration.module';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigurationService } from 'src/configuration/configuration.service';
import {
  GoogleStrategy,
  Intra42Strategy,
  Jwt2faStrategy,
  JwtStrategy,
} from './strategy';

@Module({
  imports: [
    ConfigurationModule,
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      useFactory: async (configurationService: ConfigurationService) => ({
        secret: configurationService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '1d',
        },
      }),
    }),
  ],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    Intra42Strategy,
    GoogleStrategy,
    JwtStrategy,
    Jwt2faStrategy,
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
