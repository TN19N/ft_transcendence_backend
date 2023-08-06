import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { DatabaseModule } from 'src/database/database.module';
import { UserModule } from 'src/user/user.module';
import { AuthenticationModule } from 'src/authentication/authentication.module';

@Module({
  imports: [DatabaseModule, UserModule, AuthenticationModule],
  controllers: [ChatController],
  providers: [ChatRepository, ChatService, ChatGateway],
})
export class ChatModule {}
