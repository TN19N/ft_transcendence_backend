import { Room, RoomInfo, playerPair } from './PongTypes';
import { keyPressed, nextFrame } from './gameLogic';
import { initRoom } from './roomUtils';
import { Socket } from 'socket.io';

const FPS = 60;

const GAME_INTERVAL = 1000 / FPS;

export default class RoomsGameHandler {
  private Rooms: Room[];

  constructor() {
    this.Rooms = [];
  }

  onNewMatch(clients: playerPair, speed: string) {
    const room = initRoom(clients, speed);
    this.Rooms.push(room);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    room.interval = setInterval((_) => {
      const newPos = nextFrame(room);
      if (newPos) {
        [room.ball.x, room.ball.y] = newPos;
      }
    }, GAME_INTERVAL);
  }

  getRoomByClient(client: Socket): RoomInfo | null {
    let data = null;
    this.Rooms.forEach((room, index) => {
      if (client.id === room.p1.socket.id) {
        data = {
          room: room,
          index: index,
          this: room.p1,
          other: room.p2,
        };
        return;
      }
      if (client.id === room.p2.socket.id) {
        data = {
          room: room,
          index: index,
          this: room.p2,
          other: room.p1,
        };
        return;
      }
    });
    return data;
  }

  onKeyPressed(client: Socket, key: string) {
    const roomRef = this.getRoomByClient(client);
    const val = keyPressed(key, roomRef.this);

    if (val) {
      roomRef.this.y += val;
      if (roomRef.this.y > 100) roomRef.this.y = 100;
      if (roomRef.this.y < 0) roomRef.this.y = 0;
      roomRef.this.socket.emit('my-position', roomRef.this.y);
      roomRef.other.socket.emit('player-position', roomRef.this.y);
    }
  }

  onDisconnect(client: Socket) {
    const thisRoom = this.getRoomByClient(client);
    if (!thisRoom) return false;
    const { room, index, other } = thisRoom;
    other.socket.emit('end-game-player-quit');
    other.socket.disconnect(true);
    if (room.interval) clearInterval(room.interval);
    this.Rooms.splice(index, 1);
    return true;
  }
}
