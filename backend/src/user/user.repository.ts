import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  AchievementType,
  Ban,
  FriendRequest,
  Friendship,
  Preferences,
  Prisma,
  PrismaClient,
  Profile,
  SensitiveData,
  User,
} from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UserRepository {
  constructor(private databaseService: DatabaseService) {}

  async createAchievement(userId: string, achievementType: AchievementType) {
    let title = '';
    let discretion = '';

    switch (achievementType) {
      case AchievementType.WIN_1:
        title = 'First win';
        discretion = 'You won your first game';
        break;
      case AchievementType.WIN_10:
        title = '10 wins';
        discretion = 'You won 10 games';
        break;
      case AchievementType.WIN_100:
        title = '100 wins';
        discretion = 'You won 100 games';
        break;
    }

    await this.databaseService.achievement.create({
      data: {
        user: { connect: { id: userId } },
        type: achievementType,
        title: title,
        description: discretion,
      },
    });
  }

  async saveGameRecord(p1: string, p2: string, s1: number, s2: number) {
    await this.databaseService.$transaction(async (prisma: PrismaClient) => {
      await this.databaseService.gameRecord.createMany({
        data: [
          {
            userId: p1,
            opponentId: p2,
            userScore: s1,
            opponentScore: s2,
          },
          {
            userId: p2,
            opponentId: p1,
            userScore: s2,
            opponentScore: s1,
          },
        ],
      });

      await prisma.profile.update({
        where: { id: p1 },
        data: {
          wins: { increment: s1 > s2 ? 1 : 0 },
          losses: { increment: s1 < s2 ? 1 : 0 },
        },
      });

      await prisma.profile.update({
        where: { id: p2 },
        data: {
          wins: { increment: s2 > s1 ? 1 : 0 },
          losses: { increment: s2 < s1 ? 1 : 0 },
        },
      });
    });
  }

  getLeaderboard() {
    return this.databaseService.profile.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        wins: true,
        losses: true,
      },
      orderBy: { wins: 'desc' },
    });
  }

  getAchievements(userId: string) {
    return this.databaseService.achievement.findMany({
      where: { userId: userId },
    });
  }

  async updateAvatarType(userId: string, avatarType: string) {
    await this.databaseService.profile.update({
      where: { id: userId },
      data: { avatarType: avatarType },
    });
  }

  getGroupInvites(userId: string) {
    return this.databaseService.group.findMany({
      where: {
        requests: {
          some: {
            receiverId: userId,
          },
        },
      },
    });
  }

  async deleteGroupInvite(receiverId: string, groupId: string) {
    await this.databaseService.groupInvite.delete({
      where: {
        GroupInviteId: {
          receiverId: receiverId,
          groupId: groupId,
        },
      },
    });
  }

  getGroupInvite(userId: string, groupId: string) {
    return this.databaseService.groupInvite.findUnique({
      where: {
        GroupInviteId: {
          receiverId: userId,
          groupId: groupId,
        },
      },
    });
  }

  async unBanUserFromGroup(userToUnBanId: string, groupId: string) {
    await this.databaseService.group.update({
      where: { id: groupId },
      data: { bannedUsers: { disconnect: { id: userToUnBanId } } },
    });
  }

  async banUserFromGroup(userToBanId: string, groupId: string) {
    await this.databaseService.$transaction(async (prisma: PrismaClient) => {
      await prisma.userGroup.delete({
        where: {
          UserGroupId: {
            userId: userToBanId,
            groupId: groupId,
          },
        },
      });

      await prisma.group.update({
        where: { id: groupId },
        data: {
          bannedUsers: { connect: { id: userToBanId } },
          membersCount: { decrement: 1 },
        },
      });
    });
  }

  async deleteFriendship(userId: string, friendId: string) {
    await this.databaseService.$transaction(async (prisma: PrismaClient) => {
      await prisma.friendship.deleteMany({
        where: {
          OR: [
            {
              userId: userId,
              friendId: friendId,
            },
            {
              userId: friendId,
              friendId: userId,
            },
          ],
        },
      });

      await prisma.profile.update({
        where: { id: userId },
        data: { friendsNumber: { decrement: 1 } },
      });

      await prisma.profile.update({
        where: { id: friendId },
        data: { friendsNumber: { decrement: 1 } },
      });
    });
  }

  getBanedUsers(userId: string) {
    return this.databaseService.profile.findMany({
      where: {
        user: {
          bannedBy: {
            some: {
              userId: userId,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async deleteBan(userId: string, userToUnBanId: string) {
    await this.databaseService.ban.delete({
      where: {
        BanId: {
          userId: userId,
          bannedUserId: userToUnBanId,
        },
      },
    });
  }

  async createBan(userId: string, userToBanId: string) {
    await this.databaseService.$transaction(async (prisma: PrismaClient) => {
      await prisma.ban.create({
        data: {
          user: { connect: { id: userId } },
          bannedUser: { connect: { id: userToBanId } },
        },
      });

      const friendship = await prisma.friendship.deleteMany({
        where: {
          OR: [
            {
              userId: userId,
              friendId: userToBanId,
            },
            {
              userId: userToBanId,
              friendId: userId,
            },
          ],
        },
      });

      if (friendship.count > 0) {
        await prisma.profile.update({
          where: { id: userId },
          data: { friendsNumber: { decrement: 1 } },
        });

        await prisma.profile.update({
          where: { id: userToBanId },
          data: { friendsNumber: { decrement: 1 } },
        });
      } else {
        await prisma.friendRequest.deleteMany({
          where: {
            OR: [
              {
                senderId: userId,
                receiverId: userToBanId,
              },
              {
                senderId: userToBanId,
                receiverId: userId,
              },
            ],
          },
        });
      }
    });
  }

  async getBan(userId: string, userToBanId: string): Promise<Ban | null> {
    return this.databaseService.ban.findUnique({
      where: {
        BanId: {
          userId: userId,
          bannedUserId: userToBanId,
        },
      },
    });
  }

  async createFriendship(userId: string, friendId: string) {
    await this.databaseService.$transaction(async (prisma: PrismaClient) => {
      await prisma.friendship.createMany({
        data: [
          {
            userId: userId,
            friendId: friendId,
          },
          {
            userId: friendId,
            friendId: userId,
          },
        ],
      });

      await prisma.friendRequest.deleteMany({
        where: {
          OR: [
            {
              senderId: userId,
              receiverId: friendId,
            },
            {
              senderId: friendId,
              receiverId: userId,
            },
          ],
        },
      });

      await prisma.profile.update({
        where: { id: userId },
        data: { friendsNumber: { increment: 1 } },
      });

      await prisma.profile.update({
        where: { id: friendId },
        data: { friendsNumber: { increment: 1 } },
      });
    });
  }

  getFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<FriendRequest | null> {
    return this.databaseService.friendRequest.findUnique({
      where: {
        FriendRequestId: {
          senderId: senderId,
          receiverId: receiverId,
        },
      },
    });
  }

  async deletFriendRequest(senderId: string, receiverId: string) {
    await this.databaseService.friendRequest.delete({
      where: {
        FriendRequestId: {
          senderId: senderId,
          receiverId: receiverId,
        },
      },
    });
  }

  createFriendRequest(
    userId: string,
    friendId: string,
  ): Promise<FriendRequest> {
    return this.databaseService.friendRequest.create({
      data: {
        sender: { connect: { id: userId } },
        receiver: { connect: { id: friendId } },
      },
    });
  }

  getFriendship(userId: string, friendId: string): Promise<Friendship | null> {
    return this.databaseService.friendship.findUnique({
      where: {
        FriendshipId: {
          userId: userId,
          friendId: friendId,
        },
      },
    });
  }

  getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
    return this.databaseService.user
      .findUnique({
        where: {
          id: userId,
        },
        select: {
          sentFriendRequests: true,
        },
      })
      .sentFriendRequests();
  }

  getReceivedFriendRequests(userId: string) {
    return this.databaseService.profile.findMany({
      where: {
        user: {
          sentFriendRequests: {
            some: {
              receiverId: userId,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  getFriends(userId: string) {
    return this.databaseService.profile.findMany({
      where: {
        user: {
          friends: {
            some: {
              friendId: userId,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
  }

  getUserByGoogleId(googleId: string): Promise<User | null> {
    return this.databaseService.sensitiveData
      .findUnique({
        where: { googleId: googleId },
        select: { user: true },
      })
      .user();
  }

  getUserByIntra42Id(intra42Id: number): Promise<User | null> {
    return this.databaseService.sensitiveData
      .findUnique({
        where: { intra42Id: intra42Id },
        select: { user: true },
      })
      .user();
  }

  getUserById(id: string): Promise<User | null> {
    return this.databaseService.user.findUnique({
      where: {
        id: id,
      },
    });
  }

  createUser(
    name: string,
    { intra42Id, googleId }: { intra42Id?: number; googleId?: string },
  ): Promise<User> {
    if (intra42Id) {
      return this.databaseService.user.create({
        data: {
          profile: {
            create: {
              name: name,
            },
          },
          preferences: { create: {} },
          sensitiveData: {
            create: {
              intra42Id: intra42Id,
              googleId: googleId,
            },
          },
        },
      });
    } else if (googleId) {
      return this.databaseService.user.create({
        data: {
          profile: {
            create: {
              name: name,
            },
          },
          preferences: { create: {} },
          sensitiveData: {
            create: {
              googleId: googleId,
            },
          },
        },
      });
    } else {
      throw new InternalServerErrorException();
    }
  }

  getProfile(id: string): Promise<Profile | null> {
    return this.databaseService.profile.findUnique({
      where: {
        id: id,
      },
    });
  }

  getPreferences(id: string): Promise<Preferences | null> {
    return this.databaseService.preferences.findUnique({
      where: {
        id: id,
      },
    });
  }

  getSensitiveData(id: string): Promise<SensitiveData | null> {
    return this.databaseService.sensitiveData.findUnique({
      where: {
        id: id,
      },
    });
  }

  updateProfile(
    id: string,
    profile: Prisma.ProfileUpdateInput,
  ): Promise<Profile> {
    return this.databaseService.profile.update({
      where: {
        id: id,
      },
      data: profile,
    });
  }

  updatePreferences(
    id: string,
    preferences: Prisma.PreferencesUpdateInput,
  ): Promise<Preferences> {
    return this.databaseService.preferences.update({
      where: {
        id: id,
      },
      data: preferences,
    });
  }

  updateSensitiveData(
    id: string,
    sensitiveData: Prisma.SensitiveDataUpdateInput,
  ) {
    return this.databaseService.sensitiveData.update({
      where: {
        id: id,
      },
      data: sensitiveData,
    });
  }

  getUserWithNameStartingWith(userId: string, query: string) {
    return this.databaseService.profile.findMany({
      where: {
        id: { not: userId },
        user: {
          bannedUsers: {
            none: {
              bannedUserId: userId,
            },
          },
          bannedBy: {
            none: {
              userId: userId,
            },
          },
          friends: {
            none: {
              friendId: userId,
            },
          },
          profile: {
            name: {
              startsWith: query,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
  }
}
