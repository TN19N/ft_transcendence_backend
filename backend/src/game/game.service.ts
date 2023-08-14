import { Injectable } from '@nestjs/common';
import QueueGameHandler from './queueHandler';
import { Socket } from 'socket.io';
import RoomsGameHandler from './roomsHandler';
import { UserRepository } from 'src/user/user.repository';
import { AchievementType } from '@prisma/client';

@Injectable()
export class GameService {
  private queue: QueueGameHandler;
  private room: RoomsGameHandler;

  constructor(private userRepository: UserRepository) {
    this.queue = new QueueGameHandler();
    this.room = new RoomsGameHandler();
  }

  private async saveAchievements(id: string) {
    const profile = await this.userRepository.getProfile(id);

    if (profile.wins === 1) {
      await this.userRepository.createAchievement(id, AchievementType.WIN_1);
    } else if (profile.wins === 10) {
      await this.userRepository.createAchievement(id, AchievementType.WIN_10);
    } else if (profile.wins === 100) {
      await this.userRepository.createAchievement(id, AchievementType.WIN_100);
    }
  }

  async saveGameRecord(p1: string, p2: string, s1: number, s2: number) {
    await this.userRepository.saveGameRecord(p1, p2, s1, s2);
    await this.saveAchievements(s1 > s2 ? p1 : p2);
  }

  onKeyPressed(client: Socket, key: string) {
    this.room.onKeyPressed(client, key);
  }

  onNewConnection(client: Socket, speed: string) {
    const match = this.queue.addClientToQueue(client, speed);
    if (!match) return;
    this.room.onNewMatch(match, speed);
  }

  disconnected(client: Socket) {
    const res = this.room.onDisconnect(client);
    if (res) return;
    this.queue.quit(client);
  }
}
