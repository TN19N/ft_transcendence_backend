import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { GameService } from './game.service';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { JwtPayload } from 'src/authentication/interface';
import { UserRepository } from 'src/user/user.repository';
import { UnauthorizedException } from '@nestjs/common';
import { Status } from '@prisma/client';

@WebSocketGateway({
  cors: process.env.FRONTEND_URL,
  credentials: true,
  namespace: 'game',
})
export class GameGateway implements OnGatewayDisconnect {
  constructor(
    private readonly gameService: GameService,
    private authenticationService: AuthenticationService,
    private userRepository: UserRepository,
  ) {}

  async handleConnection(client: Socket) {
    const id = await this.validateJwtWbSocket(client);

    if (!id) {
      this.disconnect(client);
    }

    await this.userRepository.updateProfile(id, {
      status: Status.PLAYING,
    });

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
  clientSpeedHandler(
    @ConnectedSocket() client: Socket,
    @MessageBody() speed: string,
  ) {
    this.gameService.onNewConnection(client, speed);
  }

  async handleDisconnect(client: Socket) {
    const userId = await this.validateJwtWbSocket(client);

    await this.userRepository.updateProfile(userId, {
      status: Status.ONLINE,
    });

    this.gameService.disconnected(client, userId);
  }

  async validateJwtWbSocket(socket: Socket): Promise<string | null> {
    const jwtToken = socket.handshake.headers.cookie
      ?.split(';')
      .find((cookie: string) => cookie.startsWith('Authentication='))
      ?.split('=')[1];

    if (jwtToken) {
      const payload: JwtPayload =
        await this.authenticationService.validateJwt(jwtToken);

      if (payload && payload.tfa == false) {
        return (await this.userRepository.getUserById(payload.sub))?.id;
      }
    }

    return null;
  }

  private disconnect(socket: Socket) {
    socket.emit('error', new UnauthorizedException());
    socket.disconnect();
  }
}
