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

  addClientToQueue(
    client: Socket,
    id: string,
    speed: string,
  ): playerPair[] | null {
    this.pool[speed].push({ client, id });
    client.emit('delay', 'Wait for pair...');
    const lot: playerPair[] = [];
    while (this.pool[speed].length >= 2) {
      const { client: p1, id: pu1 } = this.pool[speed].shift();
      const { client: p2, id: pu2 } = this.pool[speed].shift();

      const match: playerPair = { p1, p2, pu1, pu2 };
      lot.push(match);
    }
    return lot;
  }

  quit(client: Socket) {
    for (const key in this.pool) {
      this.pool[key] = this.pool[key].filter(
        ({ client: item }) => item !== client,
      );
    }
  }
}
