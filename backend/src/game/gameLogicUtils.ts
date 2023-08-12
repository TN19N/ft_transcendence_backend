import { Pos, Room } from './PongTypes';

const TABLE_WIDTH = 100;

const PADDLE_MARGINS = 1.5;

const PADDLE_HEIGHT = 16.7;

export const mapRange = (
  value: number,
  fromLow: number,
  fromHigh: number,
  toLow: number,
  toHigh: number,
) => {
  const ratio = (value - fromLow) / (fromHigh - fromLow);
  const mappedValue = ratio * (toHigh - toLow) + toLow;

  return mappedValue;
};

export const degrees_to_radians = (degrees: number) => {
  return degrees * (Math.PI / 180);
};

export const cosIt = (room: Room, angle: number) => {
  if (room.ball.x > TABLE_WIDTH - PADDLE_MARGINS)
    return room.speed * Math.cos(angle);
  return room.speed * Math.cos(angle) * -1;
};

export const calcAngle = (room: Room, ball: number, paddle: number) => {
  const rad = degrees_to_radians(135);

  const diff = paddle + PADDLE_HEIGHT * 2 - ball;

  const angle = mapRange(diff, -PADDLE_HEIGHT, PADDLE_HEIGHT, -rad, rad);

  const pos: Pos = {
    x: Number(cosIt(room, angle).toPrecision(3)),
    y: Number((room.speed * Math.sin(angle)).toPrecision(3)),
  };
  return pos;
};

export const autoGame = (room: Room) => {
  if (room.ball.x < TABLE_WIDTH / 2) {
    room.p1.y = room.ball.y;
    room.p1.socket.emit('my-position', room.p1.y);
    room.p2.socket.emit('player-position', room.p1.y);
  }
  if (room.ball.x > TABLE_WIDTH / 2) {
    room.p2.y = room.ball.y;
    room.p2.socket.emit('my-position', room.p2.y);
    room.p1.socket.emit('player-position', room.p2.y);
  }
};
