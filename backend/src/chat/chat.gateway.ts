import { UnauthorizedException } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { UserGroup } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { JwtPayload } from 'src/authentication/interface';
import { UserRepository } from 'src/user/user.repository';

enum MessageType {
  DM = 'dm',
  GROUP = 'group',
}

@WebSocketGateway({
  cors: process.env.FRONTEND_URL,
  credentials: true,
  namespace: 'chat',
})
export class ChatGateway {
  constructor(
    private userRepository: UserRepository,
    private authenticationService: AuthenticationService,
  ) {}

  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, Socket[]> = new Map();

  async handleConnection(socket: Socket) {
    const userId = await this.validateJwtWbSocket(socket);

    if (!userId) {
      return this.disconnect(socket);
    }

    socket.on('disconnect', async () => {
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

  async handleDisconnect(socket: Socket) {
    for (const [key, value] of this.connectedUsers.entries()) {
      if (value.includes(socket)) {
        this.connectedUsers.set(
          key,
          value.filter((item) => item !== socket),
        );
      }
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
    socket.disconnect();
  }
}
