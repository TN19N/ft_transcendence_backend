import { Socket } from 'socket.io';

type SocketsWithIds = {
  client: Socket;
  id: string;
}[];

export type gameQeue = {
  Slow: SocketsWithIds;
  Medium: SocketsWithIds;
  Fast: SocketsWithIds;
};

export type playerPair = {
  p1: Socket;
  p2: Socket;
  pu1: string;
  pu2: string;
};

export type UserData = {
  socket: Socket;
  score: number;
  y: number;
  id: string;
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
  id2: string;
  client?: Socket;
  speed: string;
  time: Date;
};
