import { Injectable } from '@nestjs/common';
import { Group, GroupType, PrismaClient, Role } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ChatRepository {
  constructor(private databaseService: DatabaseService) {}

  async deleteGroup(groupId: string) {
    await this.databaseService.group.delete({
      where: { id: groupId },
    });
  }

  transferOwnership(fromUserId: string, toUserId: string, groupId: string) {
    return this.databaseService.$transaction(async (prisma: PrismaClient) => {
      await prisma.userGroup.update({
        where: {
          UserGroupId: {
            userId: fromUserId,
            groupId: groupId,
          },
        },
        data: { role: Role.MEMBER },
      });

      await prisma.group.update({
        where: { id: groupId },
        data: {
          owner: { connect: { id: toUserId } },
          members: {
            update: {
              where: { UserGroupId: { userId: toUserId, groupId: groupId } },
              data: { role: Role.OWNER },
            },
          },
        },
      });
    });
  }

  async deleteUserGroup(userId: string, groupId: string) {
    await this.databaseService.$transaction(async (prisma: PrismaClient) => {
      await prisma.userGroup.delete({
        where: {
          UserGroupId: {
            userId: userId,
            groupId: groupId,
          },
        },
      });

      await prisma.group.update({
        where: { id: groupId },
        data: { membersCount: { decrement: 1 } },
      });
    });
  }

  getBannedUsers(groupId: string) {
    return this.databaseService.group
      .findUnique({
        where: { id: groupId },
        select: { bannedUsers: true },
      })
      .bannedUsers();
  }

  getGroupMembers(groupId: string) {
    return this.databaseService.userGroup.findMany({
      where: { groupId: groupId },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            profile: {
              select: {
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  async updateUserGroupRole(userId: string, groupId: string, role: Role) {
    await this.databaseService.userGroup.update({
      where: {
        UserGroupId: {
          userId: userId,
          groupId: groupId,
        },
      },
      data: {
        role: role,
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

  getGroupInvite(receiverId: string, groupId: string) {
    return this.databaseService.groupInvite.findUnique({
      where: {
        GroupInviteId: {
          receiverId: receiverId,
          groupId: groupId,
        },
      },
    });
  }

  async acceptGroupInvite(userId: string, groupId: string) {
    await this.databaseService.$transaction(async (prisma) => {
      await prisma.groupInvite.deleteMany({
        where: {
          groupId: groupId,
          receiverId: userId,
        },
      });

      await prisma.userGroup.create({
        data: {
          user: { connect: { id: userId } },
          group: { connect: { id: groupId } },
          role: Role.MEMBER,
        },
      });

      await prisma.group.update({
        where: { id: groupId },
        data: { membersCount: { increment: 1 } },
      });
    });
  }

  async createGroupInvite(receiverId: string, groupId: string) {
    await this.databaseService.groupInvite.create({
      data: {
        receiver: { connect: { id: receiverId } },
        group: { connect: { id: groupId } },
      },
    });
  }

  async updateGroup(
    groupId: string,
    name?: string,
    type?: GroupType,
    password?: string,
  ) {
    await this.databaseService.group.update({
      where: { id: groupId },
      data: {
        name: name,
        type: type,
        sensitiveData: {
          update: { password: password },
        },
      },
    });
  }

  getFriendsToJoin(userId: string, groupId: string) {
    return this.databaseService.profile.findMany({
      where: {
        user: {
          friendOf: {
            some: {
              userId: userId,
            },
          },
          joinedGroups: {
            none: {
              groupId: groupId,
            },
          },
        },
      },
      include: {
        user: {
          include: {
            bannedGroups: {
              where: {
                id: groupId,
              },
            },
            receivedGroupRequests: {
              where: {
                groupId: groupId,
              },
            },
          },
        },
      },
    });
  }

  createGroupMessage(userId: string, groupId: string, message: string) {
    return this.databaseService.messageGroup.create({
      data: {
        sender: { connect: { id: userId } },
        group: { connect: { id: groupId } },
        message: message,
      },
    });
  }

  async addUserToGroup(userId: string, groupId: string) {
    await this.databaseService.$transaction(async (prisma: PrismaClient) => {
      await prisma.groupInvite.deleteMany({
        where: {
          groupId: groupId,
          receiverId: userId,
        },
      });

      await prisma.userGroup.create({
        data: {
          user: { connect: { id: userId } },
          group: { connect: { id: groupId } },
          role: Role.MEMBER,
        },
      });

      await prisma.group.update({
        where: { id: groupId },
        data: { membersCount: { increment: 1 } },
      });
    });
  }

  getUserGroup(userId: string, groupId: string) {
    return this.databaseService.userGroup.findUnique({
      where: {
        UserGroupId: {
          userId: userId,
          groupId: groupId,
        },
      },
    });
  }

  getGroupById(id: string) {
    return this.databaseService.group.findUnique({
      where: { id: id },
      include: {
        members: true,
        bannedUsers: true,
        sensitiveData: true,
      },
    });
  }

  getGroupMessages(groupId: string) {
    return this.databaseService.messageGroup.findMany({
      where: { groupId: groupId },
      include: {
        sender: {
          select: {
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  getGroups(userId: string): Promise<Group[]> {
    return this.databaseService.group.findMany({
      where: { members: { some: { userId: userId } } },
      include: {
        members: { select: { userId: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  getJoinedGroups(userId: string) {
    return this.databaseService.group.findMany({
      where: {
        members: {
          some: { userId: userId },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
            senderId: true,
            message: true,
          },
        },
      },
    });
  }

  getGroupWithNameStartWith(userId: string, query: string) {
    return this.databaseService.group.findMany({
      where: {
        name: { startsWith: query },
        type: { not: GroupType.PRIVATE },
        members: { none: { userId: userId } },
        bannedUsers: { none: { id: userId } },
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });
  }

  createGroup(
    userId: string,
    name: string,
    type: GroupType,
    password?: string,
  ) {
    return this.databaseService.$transaction(async (prisma) => {
      const group = await prisma.group.create({
        data: {
          owner: { connect: { id: userId } },
          name: name,
          type: type,
          sensitiveData: {
            create: {
              password: password,
            },
          },
        },
      });

      await prisma.userGroup.create({
        data: {
          user: { connect: { id: userId } },
          group: { connect: { name: name } },
          role: Role.OWNER,
        },
      });

      return group;
    });
  }

  createDmMessage(senderId: string, receiverId: string, message: string) {
    return this.databaseService.messageDm.create({
      data: {
        sender: { connect: { id: senderId } },
        receiver: { connect: { id: receiverId } },
        message: message,
      },
    });
  }

  getDm(userId: string, pairId: string) {
    return this.databaseService.messageDm.findMany({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: pairId,
          },
          {
            senderId: pairId,
            receiverId: userId,
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  getDms(userId: string) {
    return this.databaseService.messageDm.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: {
        createdAt: true,
        senderId: true,
        receiverId: true,
        message: true,
        sender: {
          select: {
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
        receiver: {
          select: {
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
