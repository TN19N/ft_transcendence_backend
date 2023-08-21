import { Room, playerPair } from './PongTypes';

const SPEEDS = {
  Slow: 0.6,
  Medium: 0.8,
  Fast: 1.2,
};

const DEFAULT_SIZE = 50; // standare size for calculation W: 100, H: 100;

export const initRoom = (clients: playerPair, speed: string): Room => {
  const room: Room = {
    p1: {
      socket: clients.p1,
      score: 0,
      y: DEFAULT_SIZE,
      id: clients.pu1,
    },
    p2: {
      socket: clients.p2,
      score: 0,
      y: DEFAULT_SIZE,
      id: clients.pu2,
    },
    ball: {
      x: DEFAULT_SIZE,
      y: DEFAULT_SIZE,
      vy: randomVelocity(SPEEDS[speed]),
      vx: randomVelocity(SPEEDS[speed]),
    },
    revX: DEFAULT_SIZE,
    interval: 0,
    speed: SPEEDS[speed],
    delay: 3,
    timer: 0,
  };
  emitScore(room);
  return room;
};

const randomVelocity = (speed: number) => {
  return [-speed, speed][Math.floor(Math.random() * 2)];
};

export const resetGame = (room: Room) => {
  room.ball.x = DEFAULT_SIZE;
  room.ball.y = DEFAULT_SIZE;
  (room.revX = DEFAULT_SIZE), (room.ball.vx = randomVelocity(room.speed));
  room.ball.vy = randomVelocity(room.speed);
  (room.delay = 3), (room.timer = 0);
};

export const emitScore = (room: Room) => {
  const p1Info = room.p1.score.toString();
  const p2Info = room.p2.score.toString();
  const data = { this: p1Info, other: p2Info };

  room.p1.socket.emit('new-score', data);
  data.this = p2Info;
  data.other = p1Info;
  room.p2.socket.emit('new-score', data);
};
