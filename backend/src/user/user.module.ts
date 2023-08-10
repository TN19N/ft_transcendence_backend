import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from 'src/database/database.module';
import { UserRepository } from './user.repository';
import { TestController, UserController } from './user.controller';
import { ConfigurationModule } from 'src/configuration/configuration.module';
import { AuthenticationModule } from 'src/authentication/authentication.module';
import { UserGateway } from './user.gateway';

@Module({
  imports: [
    DatabaseModule,
    ConfigurationModule,
    forwardRef(() => AuthenticationModule),
  ],
  controllers: [UserController, TestController],
  providers: [UserService, UserRepository, UserGateway],
  exports: [UserRepository, UserGateway],
})
export class UserModule {}
