import { Module } from '@nestjs/common';
import { ConfigurationModule } from './configuration/configuration.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigurationModule,
    AuthenticationModule,
    DatabaseModule,
    UserModule,
  ],
})
export class AppModule {}
