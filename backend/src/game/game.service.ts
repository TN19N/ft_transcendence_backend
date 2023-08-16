import { Injectable } from '@nestjs/common';
import QueueGameHandler from './queueHandler';
import { Socket } from 'socket.io';
import RoomsGameHandler from './roomsHandler';
import { UserRepository } from 'src/user/user.repository';
import { AchievementType } from '@prisma/client';
import { UserData, inviteDbId, playerPair } from './PongTypes';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { JwtPayload } from 'src/authentication/interface';

@Injectable()
export class GameService {
  private queue: QueueGameHandler;
  private room: RoomsGameHandler;
  private clients: string[];
  private WaitInvite: inviteDbId[];

  constructor(
    private userRepository: UserRepository,
    private authenticationService: AuthenticationService,
  ) {
    this.queue = new QueueGameHandler();
    this.room = new RoomsGameHandler();
    this.clients = [];
    this.WaitInvite = [];
  }

  onRowConnection(client: Socket, userDbId: string, id: string, speed: string) {
    this.clients.push(id);
    if (!userDbId || !speed) {
      this.cheakIfInvited(client, id, speed);
      return
    }
    this.WaitInvite.push({ id: userDbId, client: client });
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

  async saveGameRecord({ score: s1, socket: p1 }: UserData, { score: s2, socket: p2 }: UserData) {
    const pu1 = await this.validateJwtWbSocket(p1);
    const pu2 = await this.validateJwtWbSocket(p2);
    await this.userRepository.saveGameRecord(pu1, pu2, s1, s2);
    await this.saveAchievements(s1 > s2 ? pu1 : pu2);
  }

  onKeyPressed(client: Socket, key: string) {
    this.room.onKeyPressed(client, key);
  }

  onNewConnection(client: Socket, speed: string) {
    const match = this.queue.addClientToQueue(client, speed);
    match.forEach(item => {
      this.room.onNewMatch(item, speed);
    })
  }

  cheakIfInvited(client: Socket, id: string, speed: string) {
    const pair: playerPair = {
      p1: client,
      p2: client,
    };

    this.WaitInvite = this.WaitInvite.filter(item => {
      if (item.id === id) {
        pair.p1 = client;
        pair.p2 = item.client;
        return true;
      }
    })
    if (pair.p1.id !== pair.p2.id)
      this.room.onNewMatch(pair, speed)
  }

  disconnected(client: Socket, id: string) {
    this.clients = this.clients.filter(item => item !== id);
    const res = this.room.onDisconnect(client);
    if (res) return;
    this.queue.quit(client);
  }

  async validateJwtWbSocket(socket: Socket): Promise<string | null> {
    const jwtToken = socket.handshake.headers.cookie
      ?.split(';')
      .find((cookie: string) => cookie.startsWith('Authentication='))
      ?.split('=')[1];

    if (jwtToken) {
      const payload: JwtPayload = await this.authenticationService.validateJwt(
        jwtToken,
      );

      if (payload && payload.tfa == false) {
        return (await this.userRepository.getUserById(payload.sub))?.id;
      }
    }

    return null;
  }
}
