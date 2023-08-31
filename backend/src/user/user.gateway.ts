import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { UserRepository } from './user.repository';
import { Status } from '@prisma/client';
import { ChatGateway } from 'src/chat/chat.gateway';
import { WsExceptionsFilter } from 'src/common';
import { UseFilters } from '@nestjs/common';

export enum GameSpeed {
  SLOW = 'Slow',
  MEDIUM = 'Medium',
  FAST = 'Fast',
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
@UseFilters(new WsExceptionsFilter())
export class UserGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, Socket[]> = new Map();

  constructor(
    private authenticationService: AuthenticationService,
    private userRepository: UserRepository,
    private chatGateway: ChatGateway,
  ) {}

  async handleConnection(socket: Socket) {
    const userId = await this.authenticationService.validateJwtWbSocket(socket);

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
        await this.chatGateway.sendStatusAction(userId, Status.OFFLINE);
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
      await this.chatGateway.sendStatusAction(userId, Status.ONLINE);
    }
  }

  async sendGameInvite(receiverId: string, senderId: string, speed: GameSpeed) {
    if (this.connectedUsers.has(receiverId)) {
      const { name } = await this.userRepository.getProfile(senderId);
      this.connectedUsers.get(receiverId).forEach((socket) => {
        socket.emit('notification', {
          type: NotificationType.GAME_INVITE,
          payload: {
            senderId: senderId,
            speed: speed,
            name: name,
          },
        });
      });
    }
  }

  sendGroupInvite(receiverId: string, groupId: string, name: string) {
    if (this.connectedUsers.has(receiverId)) {
      this.connectedUsers.get(receiverId).forEach((socket) => {
        socket.emit('notification', {
          type: NotificationType.GROUP_INVITE,
          payload: {
            id: groupId,
            name: name,
          },
        });
      });
    }
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (this.connectedUsers.has(receiverId)) {
      const { name } = await this.userRepository.getProfile(senderId);
      this.connectedUsers.get(receiverId).forEach((socket) => {
        socket.emit('notification', {
          type: NotificationType.FRIEND_REQUEST,
          payload: {
            id: senderId,
            name: name,
          },
        });
      });
    }
  }

  sendSignalToStartGame(receiverId: string) {
    if (this.connectedUsers.has(receiverId)) {
      this.connectedUsers.get(receiverId).forEach((socket) => {
        socket.emit('startGame');
      });
    }
  }

  sendSignalToStopTimer(receiverId: string) {
    if (this.connectedUsers.has(receiverId)) {
      this.connectedUsers.get(receiverId).forEach((socket) => {
        socket.emit('stopTimer');
      });
    }
  }

  private disconnect(socket: Socket) {
    socket.emit('error', 'Unauthorized');
    socket.disconnect(true);
  }
}
