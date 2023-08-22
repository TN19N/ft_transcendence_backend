import { UnauthorizedException } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { JwtPayload } from 'src/authentication/interface';
import { UserRepository } from './user.repository';
import { Status } from '@prisma/client';

export enum GameSpeed {
  SLOW = 'SLOW',
  MEDIUM = 'MEDIUM',
  FAST = 'FAST',
}

enum NotificationType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  GROUP_INVITE = 'GROUP_INVITE',
  GAME_INVITE = 'GAME_INVITE',
}

@WebSocketGateway({
  cors: process.env.FRONTEND_URL,
  credentials: true,
  namespace: 'user',
})
export class UserGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, Socket[]> = new Map();

  constructor(
    private authenticationService: AuthenticationService,
    private userRepository: UserRepository,
  ) {}

  async handleConnection(socket: Socket) {
    const userId = await this.validateJwtWbSocket(socket);

    if (!userId) {
      return this.disconnect(socket);
    }

    socket.on('disconnect', async () => {
      for (const [key, value] of this.connectedUsers.entries()) {
        if (value.includes(socket)) {
          this.connectedUsers.set(
            key,
            value.filter((item) => item.id !== socket.id),
          );
        }
      }
      if (this.connectedUsers.get(userId).length === 0) {
        this.connectedUsers.delete(userId);
        await this.userRepository.updateProfile(userId, {
          status: Status.OFFLINE,
        });
      }
    });

    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, [
        ...this.connectedUsers.get(userId),
        socket,
      ]);
    } else {
      this.connectedUsers.set(userId, [socket]);
      await this.userRepository.updateProfile(userId, {
        status: Status.ONLINE,
      });
    }
  }

  sendGameInvite(receiverId: string, senderId: string, speed: GameSpeed) {
    if (this.connectedUsers.has(receiverId)) {
      this.connectedUsers.get(receiverId).forEach((socket) => {
        socket.emit('notification', {
          type: NotificationType.GAME_INVITE,
          payload: {
            senderId: senderId,
            speed: speed,
          },
        });
      });
    }
  }

  sendGroupInvite(receiverId: string, groupId: string) {
    if (this.connectedUsers.has(receiverId)) {
      this.connectedUsers.get(receiverId).forEach((socket) => {
        socket.emit('notification', {
          type: NotificationType.GROUP_INVITE,
          payload: {
            groupId: groupId,
          },
        });
      });
    }
  }

  sendFriendRequest(senderId: string, receiverId: string) {
    if (this.connectedUsers.has(receiverId)) {
      this.connectedUsers.get(receiverId).forEach((socket) => {
        socket.emit('notification', {
          type: NotificationType.FRIEND_REQUEST,
          payload: {
            senderId: senderId,
          },
        });
      });
    }
  }

  private async validateJwtWbSocket(socket: Socket): Promise<string | null> {
    const jwtToken = socket.handshake.headers.cookie
      ?.split(';')
      .find((cookie: string) => cookie.startsWith('Authentication='))
      ?.split('=')[1];

    if (jwtToken) {
      const payload: JwtPayload =
        await this.authenticationService.validateJwt(jwtToken);

      if (payload && payload.tfa == false) {
        return (await this.userRepository.getUserById(payload.sub))?.id;
      }
    }

    return null;
  }

  private disconnect(socket: Socket) {
    socket.emit('error', new UnauthorizedException());
    socket.disconnect(true);
  }
}
