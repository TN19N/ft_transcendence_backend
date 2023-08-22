import { UnauthorizedException } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UserGroup } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AuthenticationService } from 'src/authentication/authentication.service';

enum MessageType {
  DM = 'dm',
  GROUP = 'group',
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

  sendDmMessage(senderId: string, receiverId: string, message: string) {
    if (senderId != receiverId && this.connectedUsers.has(receiverId)) {
      this.connectedUsers.get(receiverId).forEach((socket) => {
        socket.emit('message', {
          type: MessageType.DM,
          payload: {
            senderId: senderId,
            message: message,
          },
        });
      });
    }
  }

  sendGroupMessage(
    members: UserGroup[],
    groupId: string,
    senderId: string,
    message: string,
  ) {
    for (const member of members) {
      if (senderId != member.userId && this.connectedUsers.has(member.userId)) {
        this.connectedUsers.get(member.userId).forEach((socket) => {
          socket.emit('message', {
            type: MessageType.GROUP,
            payload: {
              groupId: groupId,
              senderId: senderId,
              message: message,
            },
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
