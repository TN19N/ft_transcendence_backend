import { Socket } from 'socket.io';
import { gameQeue, playerPair } from './PongTypes';

export default class QueueGameHandler {
  private pool: gameQeue;

  constructor() {
    this.pool = {
      Slow: [],
      Medium: [],
      Fast: [],
    };
  }

  addClientToQueue(client: Socket, speed: string): playerPair[] | null {
    this.pool[speed].push(client);
    client.emit('delay', 'Wait for pair...');
    const lot: playerPair[] = [];
    while (this.pool[speed].length >= 2) {
      const match: playerPair = {
      p1: this.pool[speed].shift(),
      p2: this.pool[speed].shift(),
      };
      lot.push(match)
    }
    return lot;
  }

  quit(client: Socket) {
    for (let key in this.pool) {
      this.pool[key] = this.pool[key].filter(
        item => item !== client
      )
    }
  }
}
