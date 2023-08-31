import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageDm, MessageGroup, Status, UserGroup } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { UserRepository } from 'src/user/user.repository';
import { ChatRepository } from './chat.repository';
import { WsExceptionsFilter } from 'src/common';
import { UseFilters } from '@nestjs/common';

enum MessageType {
  DM = 'dm',
  GROUP = 'group',
}

export enum GroupActionType {
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
@UseFilters(new WsExceptionsFilter())
export class ChatGateway implements OnGatewayConnection {
  constructor(
    private authenticationService: AuthenticationService,
    private userRepository: UserRepository,
    private chatRepository: ChatRepository,
  ) {}

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

  sendDmMessage(senderName: string, receiverName: string, message: MessageDm) {
    for (const id of [message.senderId, message.receiverId]) {
      if (this.connectedUsers.has(id)) {
        this.connectedUsers.get(id).forEach((socket) => {
          socket.emit('message', {
            type: MessageType.DM,
            payload: {
              senderName: senderName,
              receiverName: receiverName,
              ...message,
              id: undefined,
            },
          });
        });
      }
    }
  }

  sendGroupMessage(
    members: UserGroup[],
    groupName: string,
    message: MessageGroup,
  ) {
    for (const member of members) {
      if (this.connectedUsers.has(member.userId)) {
        this.connectedUsers.get(member.userId).forEach((socket) => {
          socket.emit('message', {
            type: MessageType.GROUP,
            payload: {
              groupName: groupName,
              ...message,
              id: undefined,
            },
          });
        });
      }
    }
  }

  sendAction(actionType: GroupActionType, members: any[], payload: object) {
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

  async sendStatusAction(userId: string, status: Status) {
    const groups = await this.chatRepository.getJoinedGroups(userId);
    const friends = await this.userRepository.getFriends(userId);

    const ids: Set<string> = new Set();
    for (const { id: groupId } of groups) {
      const members = await this.chatRepository.getGroupMembers(groupId);
      for (const {
        user: { id },
      } of members) {
        ids.add(id);
      }
    }
    for (const { id } of friends) {
      ids.add(id);
    }

    for (const id of ids) {
      if (this.connectedUsers.has(id)) {
        this.connectedUsers.get(id).forEach((socket) => {
          socket.emit('status', {
            status: status,
            userId: userId,
          });
        });
      }
    }
  }

  private disconnect(socket: Socket) {
    socket.emit('error', 'Unauthorized');
    socket.disconnect(true);
  }
}
