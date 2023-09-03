import { Injectable } from '@nestjs/common';
import QueueGameHandler from './queueHandler';
import { Socket } from 'socket.io';
import RoomsGameHandler from './roomsHandler';
import { UserRepository } from 'src/user/user.repository';
import { AchievementType } from '@prisma/client';
import { Room, UserData, inviteDbId, playerPair } from './PongTypes';
import { UserGateway } from 'src/user/user.gateway';
import { InvitationDto } from './dto/invitation.dto';

@Injectable()
export class GameService {
  private queue: QueueGameHandler;
  private room: RoomsGameHandler;
  private clients: string[];
  WaitInvite: inviteDbId[];

  constructor(
    private userRepository: UserRepository,
    private userGateway: UserGateway,
  ) {
    this.queue = new QueueGameHandler();
    this.room = new RoomsGameHandler();
    this.clients = [];
    this.WaitInvite = [];
  }

  onRowConnection(client: Socket, data: InvitationDto, id: string) {
    if (this.clients.find((pid) => pid === id)) {
      client.emit('error', 'multiple connection detected');
      return client.disconnect();
    } else {
      this.clients.push(id);
    }

    if (!data) {
      return this.cheakIfInvited(client, id);
    } else if (data.id && data.speed) {
      let founded = false;
      this.WaitInvite.forEach((invite) => {
        if (invite.id2 === id) {
          founded = true;
          invite.client = client;
        }
      });
      if (founded) {
        this.userGateway.sendSignalToStartGame(data.id);
      }
      return founded;
    }
    return false;
  }

  checkInvite(senderId: string) {
    return this.WaitInvite.find((invite) => invite.id === senderId);
  }

  createNewInvite(senderId: string, recieverId: string, speed: string) {
    this.WaitInvite.push({
      id: senderId,
      id2: recieverId,
      speed: speed,
      time: new Date(),
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
    console.log('save game record: ', id1, ':', s1, ' vs ', id2, ':', s2);
    await this.userRepository.saveGameRecord(id1, id2, s1, s2);
    await this.saveAchievements(s1 > s2 ? id1 : id2);
  }

  onKeyPressed(client: Socket, key: string) {
    this.room.onKeyPressed(client, key);
  }

  onNewConnection(client: Socket, id: string, speed: string) {
    if (this.clients.find((pid) => pid === id)) {
      client.emit('error', 'multiple connection detected');
      return client.disconnect();
    } else {
      this.clients.push(id);
    }

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
      if (item.client && item.id === id) {
        pair.p2 = item.client;
        pair.pu2 = item.id2;
        speed = item.speed;
        return false;
      }
    });

    if (speed) {
      this.room.onNewMatch(pair, speed);
      return true;
    }
    return false;
  }

  async disconnected(client: Socket, id: string) {
    this.clients = this.clients.filter((item) => item !== id);

    const res: Room | null = await this.room.onDisconnect(client, id);
    if (res) {
      return await this.saveGameRecord(res.p1, res.p2);
    }
    this.queue.quit(client);
  }
}
