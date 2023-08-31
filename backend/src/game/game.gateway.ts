import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { GameService } from './game.service';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { UserRepository } from 'src/user/user.repository';
import { OnModuleInit, ParseEnumPipe } from '@nestjs/common';
import { Status } from '@prisma/client';
import { ChatGateway } from 'src/chat/chat.gateway';
import { schedule } from 'node-cron';
import { InvitationDto } from './dto/invitation.dto';
import { GameSpeed } from 'src/user/user.gateway';

@WebSocketGateway({
  cors: process.env.FRONTEND_URL,
  credentials: true,
  namespace: 'game',
})
export class GameGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private gameService: GameService,
    private authenticationService: AuthenticationService,
    private userRepository: UserRepository,
    private chatGateway: ChatGateway,
  ) {}

  onModuleInit() {
    schedule('*/1 * * * * *', () => {
      this.gameService.WaitInvite = this.gameService.WaitInvite.filter(
        ({ time }) => {
          return new Date().getTime() - time.getTime() <= 5000;
        },
      );
    });
  }

  async handleConnection(client: Socket) {
    const id = await this.authenticationService.validateJwtWbSocket(client);

    if (!id) {
      return this.disconnect(client);
    }

    await this.userRepository.updateProfile(id, {
      status: Status.PLAYING,
    });

    await this.chatGateway.sendStatusAction(id, Status.PLAYING);
  }

  @SubscribeMessage('start')
  async onConnection(
    @MessageBody() data: InvitationDto,
    @ConnectedSocket() client: Socket,
  ) {
    const id = await this.authenticationService.validateJwtWbSocket(client);

    if (!id) {
      return this.disconnect(client);
    }

    if (!this.gameService.onRowConnection(client, data, id)) {
      this.disconnect(client);
    }
  }

  @SubscribeMessage('key-pressed')
  onKeyPressedHandlerpad(
    @MessageBody() pressedKey: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.gameService.onKeyPressed(client, pressedKey);
  }

  @SubscribeMessage('game-speed')
  async clientSpeedHandler(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ParseEnumPipe(GameSpeed)) speed: string,
  ) {
    const id = await this.authenticationService.validateJwtWbSocket(client);

    if (!id) {
      return this.disconnect(client);
    }

    this.gameService.onNewConnection(client, id, speed);
  }

  @SubscribeMessage('dis')
  disconnect_it(@ConnectedSocket() client: Socket) {
    client.disconnect();
  }

  async handleDisconnect(client: Socket) {
    const userId = await this.authenticationService.validateJwtWbSocket(client);

    if (!userId) {
      return;
    }

    await this.userRepository.updateProfile(userId, {
      status: Status.ONLINE,
    });
    await this.chatGateway.sendStatusAction(userId, Status.ONLINE);

    await this.gameService.disconnected(client, userId);
  }

  private disconnect(socket: Socket) {
    socket.emit('error', 'Unauthorized');
    socket.disconnect(true);
  }
}
