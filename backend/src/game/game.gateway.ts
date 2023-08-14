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

  async handleConnection(socket: Socket) {
    const userId = await this.validateJwtWbSocket(socket);

    if (!userId) {
      return this.disconnect(socket);
    }
  }

  @SubscribeMessage('key-pressed') // Get pressed key from client
  onKeyPressedHandlerpad(
    @MessageBody() pressedKey: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.gameService.onKeyPressed(client, pressedKey);
  }

  @SubscribeMessage('game-speed') // Get speed from client
  clientSpeedHandler(
    @ConnectedSocket() client: Socket,
    @MessageBody() speed: string,
  ) {
    this.gameService.onNewConnection(client, speed);
  }

  // onDisconnected
  handleDisconnect(client: Socket) {
    this.gameService.disconnected(client);
  }

  private async validateJwtWbSocket(socket: Socket): Promise<string | null> {
    const jwtToken = socket.handshake.headers.cookie
      ?.split(';')
      .find((cookie: string) => cookie.startsWith('Authentication='))
      ?.split('=')[1];

    if (jwtToken) {
      const payload: JwtPayload = await this.authenticationService.validateJwt(
        jwtToken,
      );

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
