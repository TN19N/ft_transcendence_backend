import { Injectable } from '@nestjs/common';
import {
  Ban,
  FriendRequest,
  Friendship,
  Preferences,
  Prisma,
  Profile,
  SensitiveData,
  User,
} from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  getBanedUsers(userId: string): Promise<Ban[]> {
    return this.databaseService.user
      .findUnique({
        where: { id: userId },
        select: {
          bannedUsers: true,
        },
      })
      .bannedUsers();
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
    await this.databaseService.$transaction(async (prisma) => {
      await prisma.ban.create({
        data: {
          user: { connect: { id: userId } },
          bannedUser: { connect: { id: userToBanId } },
        },
      });

      await prisma.friendship.deleteMany({
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
    await this.databaseService.$transaction(async (prisma) => {
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

  getReceivedFriendRequests(userId: string): Promise<FriendRequest[]> {
    return this.databaseService.user
      .findUnique({
        where: {
          id: userId,
        },
        select: {
          receivedFriendRequests: true,
        },
      })
      .receivedFriendRequests();
  }

  getFriends(userId: string): Promise<Friendship[]> {
    return this.databaseService.user
      .findUnique({
        where: {
          id: userId,
        },
        select: {
          friends: true,
        },
      })
      .friends();
  }

  getUserByIntra42Id(intra42Id: number): Promise<User | null> {
    return this.databaseService.user.findUnique({
      where: {
        intra42Id: intra42Id,
      },
    });
  }

  getUserById(id: string): Promise<User | null> {
    return this.databaseService.user.findUnique({
      where: {
        id: id,
      },
    });
  }

  createUser(name: string, intra42Id: number): Promise<User> {
    return this.databaseService.user.create({
      data: {
        intra42Id: intra42Id,
        profile: {
          create: {
            name: name,
          },
        },
        preferences: { create: {} },
        sensitiveData: { create: {} },
      },
    });
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

  getUserWithNameStartingWith(userId, query: string): Promise<User[]> {
    return this.databaseService.user.findMany({
      where: {
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
        profile: {
          name: {
            startsWith: query,
          },
        },
      },
    });
  }
}
