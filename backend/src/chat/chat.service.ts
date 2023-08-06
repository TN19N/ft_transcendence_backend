import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { UserRepository } from 'src/user/user.repository';
import { MessageDm } from '@prisma/client';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private userRepository: UserRepository,
    private chatGateway: ChatGateway,
  ) {}

  async sendMessage(senderId: string, receiverId: string, message: string) {
    if (!(await this.userRepository.getUserById(receiverId))) {
      throw new NotFoundException(`User with id ${receiverId} not found`);
    }

    if (!(await this.userRepository.getFriendship(senderId, receiverId))) {
      throw new UnauthorizedException(
        `You are not friends with user with id ${receiverId}`,
      );
    }

    if (await this.userRepository.getBan(senderId, receiverId)) {
      throw new NotFoundException(`You have banned user with id ${receiverId}`);
    }

    if (await this.userRepository.getBan(receiverId, senderId)) {
      throw new NotFoundException(`User with id ${receiverId} has banned you`);
    }

    await this.chatRepository.createDmMessage(senderId, receiverId, message);
    this.chatGateway.sendDmMessage(senderId, receiverId, message);
  }

  async getDms(userId: string): Promise<MessageDm[]> {
    const messages: MessageDm[] = await this.chatRepository.getDms(userId);

    const messagesFiltered: MessageDm[] = [];
    const dmPast: Set<string> = new Set();

    for (const message of messages) {
      const uniqueKey = `${message.senderId}|${message.receiverId}`;

      if (!dmPast.has(uniqueKey)) {
        dmPast.add(uniqueKey);
        dmPast.add([...uniqueKey].reverse().join(''));
        messagesFiltered.push(message);
      }
    }

    return messagesFiltered;
  }

  async getDm(userId: string, withUserId: string): Promise<MessageDm[]> {
    if (!(await this.userRepository.getUserById(withUserId))) {
      throw new NotFoundException(`User with id ${withUserId} not found`);
    }

    return await this.chatRepository.getDm(userId, withUserId);
  }
}
