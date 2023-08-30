import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from 'src/database/database.module';
import { UserRepository } from './user.repository';
import { TestController, UserController } from './user.controller';
import { ConfigurationModule } from 'src/configuration/configuration.module';
import { AuthenticationModule } from 'src/authentication/authentication.module';
import { UserGateway } from './user.gateway';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigurationModule,
    forwardRef(() => ChatModule),
    forwardRef(() => AuthenticationModule),
  ],
  controllers: [UserController, TestController],
  providers: [UserService, UserRepository, UserGateway],
  exports: [UserGateway, UserRepository],
})
export class UserModule {}
