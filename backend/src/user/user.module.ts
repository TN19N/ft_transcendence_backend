import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from 'src/database/database.module';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserRepository],
})
export class UserModule {}
