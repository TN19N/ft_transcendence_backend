import { Injectable } from '@nestjs/common';
import QueueGameHandler from './queueHandler';
import { Socket } from 'socket.io';
import RoomsGameHandler from './roomsHandler';

@Injectable()
export class GameService {
  private queue: QueueGameHandler;
  private room: RoomsGameHandler;

  constructor() {
    this.queue = new QueueGameHandler();
    this.room = new RoomsGameHandler();
  }

  onKeyPressed(client: Socket, key: string) {
    this.room.onKeyPressed(client, key);
  }

  onNewConnection(client: Socket, speed: string) {
    const match = this.queue.addClientToQueue(client, speed);
    console.log('match', match);
    if (!match) return;
    this.room.onNewMatch(match, speed);
  }

  disconnected(client: Socket) {
    const res = this.room.onDisconnect(client);
    if (res) return;
    this.queue.quit(client);
  }
}
