import { BallData, Room, UserData } from './PongTypes';
import { calcAngle, mapRange } from './gameLogicUtils';
import { emitScore, resetGame } from './roomUtils';

const TABLE_WIDTH = 100;
const TABLE_HEIGHT = 100;
const SPEED_PADDLE = 3;
const PADDLE_MARGIN = 1.5;
const PADDLE_HEIGHT = 16.7;
const BALL_RADIUS = 2.1;

const paddleCollusion = (room: Room) => {
  // check if in paddle range
  let pos;
  if (room.ball.x < PADDLE_MARGIN) {
    const data = ballInPaddle(room.ball.y, room.p1.y);
    if (data) pos = calcAngle(room, data.Ball, data.paddle);
  }
  if (room.ball.x > TABLE_WIDTH - PADDLE_MARGIN) {
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
  if (key === 'up' && player.y > 0) return -SPEED_PADDLE;
  if (key === 'down' && player.y < 100) return SPEED_PADDLE;
  return;
};

const ballInPaddle = (ball: number, paddle: number) => {
  const bottomPaddlePosition = mapRange(
    paddle + PADDLE_HEIGHT,
    PADDLE_HEIGHT + BALL_RADIUS / 2,
    TABLE_WIDTH + PADDLE_HEIGHT,
    PADDLE_HEIGHT,
    TABLE_WIDTH,
  );

  const topPaddlePosition = mapRange(
    paddle - BALL_RADIUS,
    0,
    TABLE_WIDTH,
    -BALL_RADIUS,
    TABLE_WIDTH - PADDLE_HEIGHT,
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

  const angel = paddleCollusion(room);
  if (angel) {
    room.ball.vx = angel.x;
    room.ball.vy = angel.y;
  }

  if (wallCollusion(room.ball)) room.ball.vy *= -1;

  const data = {
    x: room.ball.x + room.ball.vx,
    y: room.ball.y + room.ball.vy,
  };

  room.p1.socket.emit('next-frame', data);
  room.revX -= room.ball.vx;
  room.p2.socket.emit('next-frame', { x: room.revX, y: data.y });

  return [data.x, data.y];
};
