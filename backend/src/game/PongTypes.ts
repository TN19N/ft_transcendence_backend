import { Socket } from 'socket.io';

export type gameQeue = {
  Slow: Socket[];
  Medium: Socket[];
  Fast: Socket[];
};

export type playerPair = {
  p1: Socket;
  p2: Socket;
};

export type UserData = {
  socket: Socket;
  score: number;
  y: number;
};

export type Pos = {
  x: number;
  y: number;
};

export type BallData = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type Room = {
  p1: UserData;
  p2: UserData;
  ball: BallData;
  revX: number;
  interval: number;
  speed: number;
  timer: number;
  delay: number;
};

export type RoomInfo = {
  room: Room;
  index: number;
  this: UserData;
  other: UserData;
};

export type inviteDbId = {
  id: string;
  client: Socket;
};
