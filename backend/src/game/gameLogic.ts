import { BallData, Room, UserData } from './PongTypes';
import { calcAngle, mapRange } from './gameLogicUtils';
import { emitScore, resetGame } from './roomUtils';

const TABLE_WIDGTH = 100;
const TABLE_HEIGHT = 100;
const SPEED_PADDLE = 3;
const PADDEL_MARGING = 1.5;
const PADDLE_HEIGHT = 16.7;
const BALL_RADIUS = 2.1;

const paddelCollusion = (room: Room) => {
  // check if in paddle range
  let pos;
  if (room.ball.x < PADDEL_MARGING) {
    const data = ballInPaddle(room.ball.y, room.p1.y);
    if (data) pos = calcAngle(room, data.Ball, data.paddle);
  }
  if (room.ball.x > TABLE_WIDGTH - PADDEL_MARGING) {
    const data = ballInPaddle(room.ball.y, room.p2.y);
    if (data) pos = calcAngle(room, data.Ball, data.paddle);
  }
  return pos;
};

const wallCollusion = (ball: BallData) => {
  const top = ball.y < 0;
  const bottom = ball.y > TABLE_HEIGHT;
  return top || bottom;
};

export const keyPressed = (key: string, player: UserData) => {
  if (key === 'up' && player.y > 0) return -(SPEED_PADDLE + (SPEED_PADDLE / 1.5));
  if (key === 'down' && player.y < 100) return (SPEED_PADDLE + (SPEED_PADDLE / 1.5));
  return;
};

const ballInPaddle = (ball: number, paddle: number) => {
  const bottomPaddlePosition = mapRange(
    paddle + PADDLE_HEIGHT,
    PADDLE_HEIGHT + BALL_RADIUS / 2,
    TABLE_WIDGTH + PADDLE_HEIGHT,
    PADDLE_HEIGHT,
    TABLE_WIDGTH,
  );

  const topPaddlePosition = mapRange(
    paddle - BALL_RADIUS,
    0,
    TABLE_WIDGTH,
    -BALL_RADIUS,
    TABLE_WIDGTH - PADDLE_HEIGHT,
  );

  const ballPosition = Math.floor(ball);
  if (
    ballPosition >= topPaddlePosition &&
    ballPosition <= bottomPaddlePosition
  ) {
    return {
      Ball: ballPosition,
      paddle: topPaddlePosition,
    };
  }
  return;
};

const newRound = (room: Room) => {
  if (room.ball.x >= 100) {
    room.p1.score += 1;

    return true;
  } else if (room.ball.x <= 0) {
    room.p2.score += 1;
    return true;
  }
  return false;
};

export const nextFrame = (room: Room) => {
  if (newRound(room)) {
    emitScore(room);
    resetGame(room);
    return;
  }

  const angel = paddelCollusion(room);
  if (angel) {
    room.ball.vx = angel.x;
    room.ball.vy = angel.y;
  }

  if (wallCollusion(room.ball)) room.ball.vy *= -1;
  // TORM: splite to test every paddle
  // if (room.ball.x < TABLE_WIDGTH / 2 - 1) room.ball.vx *= -1;
  // if (room.ball.x > TABLE_WIDGTH / 2 + 1) room.ball.vx *= -1;
  const data = {
    x: room.ball.x + room.ball.vx,
    y: room.ball.y + room.ball.vy,
  };

  // TORM  : auto -------------------------------------------
  // autoGame(room);
  // --------------------------------------------------------

  room.p1.socket.emit('next-frame', data);
  room.revX -= room.ball.vx;
  room.p2.socket.emit('next-frame', { x: room.revX, y: data.y });

  return [data.x, data.y];
};
