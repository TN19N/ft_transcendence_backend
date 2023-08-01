import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from 'src/database/database.module';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';
import { ConfigurationModule } from 'src/configuration/configuration.module';

@Module({
  imports: [DatabaseModule, ConfigurationModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserRepository],
})
export class UserModule {}
