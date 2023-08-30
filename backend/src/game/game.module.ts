import { Module, forwardRef } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { GameRepository } from './game.repository';
import { DatabaseModule } from 'src/database/database.module';
import { UserModule } from 'src/user/user.module';
import { AuthenticationModule } from 'src/authentication/authentication.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => AuthenticationModule),
    DatabaseModule,
    ChatModule,
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway, GameRepository],
  exports: [GameService],
})
export class GameModule {}
