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
import { UnauthorizedException } from '@nestjs/common';
import { Status } from '@prisma/client';
import { ChatGateway } from 'src/chat/chat.gateway';

@WebSocketGateway({
  cors: process.env.FRONTEND_URL,
  credentials: true,
  namespace: 'game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly gameService: GameService,
    private authenticationService: AuthenticationService,
    private userRepository: UserRepository,
    private chatGateway: ChatGateway,
  ) {}

  async handleConnection(client: Socket) {
    const id = await this.authenticationService.validateJwtWbSocket(client);

    if (!id) {
      return this.disconnect(client);
    }

    await this.userRepository.updateProfile(id, {
      status: Status.PLAYING,
    });
    await this.chatGateway.sendStatusAction(id, Status.PLAYING);

    const userId = client.handshake.query.userId as string;
    const speed = client.handshake.query.speed as string;

    this.gameService.onRowConnection(client, userId, id, speed);
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
    @MessageBody() speed: string,
  ) {
    const id = await this.authenticationService.validateJwtWbSocket(client);

    if (!id) {
      return this.disconnect(client);
    }

    this.gameService.onNewConnection(client, id, speed);
  }

  async handleDisconnect(client: Socket) {
    const userId = await this.authenticationService.validateJwtWbSocket(client);

    await this.userRepository.updateProfile(userId, {
      status: Status.ONLINE,
    });
    await this.chatGateway.sendStatusAction(userId, Status.ONLINE);

    await this.gameService.disconnected(client, userId);
  }

  private disconnect(socket: Socket) {
    socket.emit('error', new UnauthorizedException());
    socket.disconnect(true);
  }
}
