import { Room, playerPair } from './PongTypes';
import { keyPressed, nextFrame } from './gameLogic';
import { initRoom } from './roomUtils';
import { Socket } from 'socket.io';
import { GameService } from './game.service';

const FPS = 60;

const GAME_INTERVAL = 1000 / FPS;

export default class RoomsGameHandler {
  private Rooms: Room[];

  constructor(private gameService: GameService = null) {
    this.Rooms = [];
  }

  onNewMatch(clients: playerPair, speed: string) {
    const room = initRoom(clients, speed);
    this.Rooms.push(room);
    const scoreGole = 5;

    room.interval = setInterval( (_) => {
      if (room.timer <= 120) {
        if (!(room.timer % 40)) {
          if (room.delay) {
            clients.p1.emit('delay', room.delay)
            clients.p2.emit('delay', room.delay)
            room.delay -= 1
          }
        }
        
        room.timer +=1
        if (room.timer == 120) {
        clients.p1.emit('delay', '-')
        clients.p2.emit('delay', '-')
      }

        return
      }
      const newPos = nextFrame(room);
      if (newPos) {
        [room.ball.x, room.ball.y] = newPos;
      } else {
        if (room.p1.score === scoreGole || room.p2.score === scoreGole)
          this.endGame(room)
      }
    }, GAME_INTERVAL);
  }

  endGame(room: Room) {
    if (room.p1.score > room.p2.score) {
      room.p2.socket.emit('delay', 'You Lost');
      room.p2.socket.disconnect(true);
    } else {
      room.p1.socket.emit('delay', 'You Lost');
      room.p1.socket.disconnect(true);
    }
  }

  getRoomByClient(client: Socket) {
    let data;
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
    if (!roomRef)return
    const val = keyPressed(key, roomRef.this);

    if (val) {
      roomRef.this.y += val ;
      if (roomRef.this.y > 100) roomRef.this.y = 100;
      if (roomRef.this.y < 0) roomRef.this.y = 0;
      roomRef.this.socket.emit('my-position', roomRef.this.y);
      roomRef.other.socket.emit('player-position', roomRef.this.y);
    }
  }

  onDisconnect(client: Socket) {
    const thisRoom = this.getRoomByClient(client);
    if (!thisRoom) return false;
    // MTODO: add score save
    const { room, other: p2, this: p1 } = thisRoom;
    this.gameService.saveGameRecord(p1, p2);
    const oClinet = p2;
    if (room.interval) clearInterval(room.interval);
    this.Rooms = this.Rooms.filter(item => item !== room)
    oClinet.socket.emit('delay', 'You win');
    oClinet.socket.disconnect(true);
    return true;
  }
}