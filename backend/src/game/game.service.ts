import { Injectable } from '@nestjs/common';
import QueueGameHandler from './queueHandler';
import { Socket } from 'socket.io';
import RoomsGameHandler from './roomsHandler';
import { UserRepository } from 'src/user/user.repository';
import { AchievementType } from '@prisma/client';
import { Room, UserData, inviteDbId, playerPair } from './PongTypes';

@Injectable()
export class GameService {
  private queue: QueueGameHandler;
  private room: RoomsGameHandler;
  private clients: string[];
  private WaitInvite: inviteDbId[];

  constructor(private userRepository: UserRepository) {
    this.queue = new QueueGameHandler();
    this.room = new RoomsGameHandler();
    this.clients = [];
    this.WaitInvite = [];
  }

  onRowConnection(client: Socket, userDbId: string, id: string, speed: string) {
    this.clients.push(id);
    if (!userDbId && !speed) {
      this.cheakIfInvited(client, id);
      return;
    }
    this.WaitInvite.push({
      id: userDbId,
      id2: id,
      client: client,
      speed: speed,
    });
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

  private async saveGameRecord(
    { score: s1, id: id1 }: UserData,
    { score: s2, id: id2 }: UserData,
  ) {
    await this.userRepository.saveGameRecord(id1, id2, s1, s2);
    await this.saveAchievements(s1 > s2 ? id1 : id2);
  }

  onKeyPressed(client: Socket, key: string) {
    this.room.onKeyPressed(client, key);
  }

  onNewConnection(client: Socket, id: string, speed: string) {
    const match = this.queue.addClientToQueue(client, id, speed);
    match.forEach((item) => {
      this.room.onNewMatch(item, speed);
    });
  }

  cheakIfInvited(client: Socket, id: string) {
    const pair: playerPair = {
      p1: client,
      p2: client,
      pu1: id,
      pu2: id,
    };
    let speed: string | null = null;

    this.WaitInvite = this.WaitInvite.filter((item) => {
      if (item.id === id) {
        pair.p2 = item.client;
        pair.pu2 = item.id2;
        speed = item.speed;
        return false;
      }
    });

    if (speed) {
      this.room.onNewMatch(pair, speed);
    }
  }

  async disconnected(client: Socket, id: string) {
    this.clients = this.clients.filter((item) => item !== id);
    const res: Room = await this.room.onDisconnect(client);
    if (res) {
      await this.saveGameRecord(res.p1, res.p2);
      return;
    }
    this.queue.quit(client);
  }
}
