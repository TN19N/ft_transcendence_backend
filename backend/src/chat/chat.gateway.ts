import { UnauthorizedException } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageDm, MessageGroup, UserGroup } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AuthenticationService } from 'src/authentication/authentication.service';

enum MessageType {
  DM = 'dm',
  GROUP = 'group',
}

export enum ActionType {
  USER_BANNED = 'USER_BANNED',
  USER_UNBAN = 'USER_UNBANNED',
  USER_MUTED = 'USER_MUTED',
  USER_UNMUTED = 'USER_UNMUTED',
  USER_UPGRADED = 'USER_UPGRADED',
  USER_DOWNGRADED = 'USER_DOWNGRADED',
  USER_JOINED = 'USER_JOINED',
  USER_LEAVED = 'USER_LEAVED',
  GROUP_DELETED = 'GROUP_DELETED',
  OWNERSHIP_TRANSFERMED = 'OWNERSHIP_TRANSFERMED',
  GROUP_UPDATED = 'GROUP_UPDATED',
}

@WebSocketGateway({
  cors: process.env.FRONTEND_URL,
  credentials: true,
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection {
  constructor(private authenticationService: AuthenticationService) {}

  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, Socket[]> = new Map();

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
            value.filter((item) => item !== socket),
          );
        }
      }
      if (this.connectedUsers.get(userId).length === 0) {
        this.connectedUsers.delete(userId);
      }
    });

    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, [
        ...this.connectedUsers.get(userId),
        socket,
      ]);
    } else {
      this.connectedUsers.set(userId, [socket]);
    }
  }

  sendDmMessage(message: MessageDm) {
    if (this.connectedUsers.has(message.receiverId)) {
      this.connectedUsers.get(message.receiverId).forEach((socket) => {
        socket.emit('message', {
          type: MessageType.DM,
          payload: {
            ...message,
          },
        });
      });
    }
  }

  sendGroupMessage(members: UserGroup[], message: MessageGroup) {
    for (const member of members) {
      if (this.connectedUsers.has(member.userId)) {
        this.connectedUsers.get(member.userId).forEach((socket) => {
          socket.emit('message', {
            type: MessageType.GROUP,
            payload: {
              ...message,
            },
          });
        });
      }
    }
  }

  sendAction(actionType: ActionType, members: any[], payload: object) {
    for (const member of members) {
      member.userId = member.userId ?? member.user?.id;
      if (this.connectedUsers.has(member.userId)) {
        this.connectedUsers.get(member.userId).forEach((socket) => {
          socket.emit('action', {
            actionType,
            payload,
          });
        });
      }
    }
  }

  private disconnect(socket: Socket) {
    socket.emit('error', new UnauthorizedException());
    socket.disconnect(true);
  }
}
