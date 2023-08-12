import { Socket } from 'socket.io';

export type gameQeue = {
  Slow: Socket | null;
  Medium: Socket | null;
  Fast: Socket | null;
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
};

export type RoomInfo = {
  room: Room;
  index: number;
  this: UserData;
  other: UserData;
};
