import { Injectable } from '@nestjs/common';
import { MessageDm } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ChatRepository {
  constructor(private databaseService: DatabaseService) {}

  async createDmMessage(senderId: string, receiverId: string, message: string) {
    await this.databaseService.messageDm.create({
      data: {
        sender: { connect: { id: senderId } },
        receiver: { connect: { id: receiverId } },
        message: message,
      },
    });
  }

  getDm(userId: string, withUserId: string): Promise<MessageDm[]> {
    return this.databaseService.messageDm.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: withUserId,
          },
          {
            senderId: withUserId,
            receiverId: userId,
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  getDms(userId: string): Promise<MessageDm[]> {
    return this.databaseService.messageDm.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
