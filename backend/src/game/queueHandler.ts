import { Socket } from 'socket.io';
import { gameQueue, playerPair } from './PongTypes';

export default class QueueGameHandler {
  private pool: gameQueue;

  constructor() {
    this.pool = {
      Slow: null,
      Medium: null,
      Fast: null,
    };
  }

  addClientToQueue(client: Socket, speed: string): playerPair | null {
    if (!this.pool[speed]) {
      this.pool[speed] = client;
      return null;
    }
    const match: playerPair = {
      p1: this.pool[speed],
      p2: client,
    };
    this.pool[speed] = null;
    return match;
  }

  quit(client: Socket) {
    for (const key in this.pool) {
      if (this.pool[key] && this.pool[key].id === client.id) {
        this.pool[key] = null;
        return;
      }
    }
  }
}
