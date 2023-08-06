import { Module } from '@nestjs/common';
import { ConfigurationModule } from './configuration/configuration.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigurationModule,
    AuthenticationModule,
    DatabaseModule,
    UserModule,
    ChatModule,
  ],
})
export class AppModule {}
