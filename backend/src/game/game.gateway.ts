import { WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({
  namespace: 'game',
})
export class GameGateway {}
