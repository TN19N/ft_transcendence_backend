import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({
  namespace: 'game',
})
export class GameGateway implements OnGatewayDisconnect {
  constructor(private readonly gameService: GameService) {}

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
}
