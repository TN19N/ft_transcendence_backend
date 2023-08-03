import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from 'src/database/database.module';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';
import { ConfigurationModule } from 'src/configuration/configuration.module';
import { AuthenticationModule } from 'src/authentication/authentication.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigurationModule,
    forwardRef(() => AuthenticationModule),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserRepository],
})
export class UserModule {}
