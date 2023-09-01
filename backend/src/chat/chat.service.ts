import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { UserRepository } from 'src/user/user.repository';
import { GroupType, MessageDm, Prisma, Role } from '@prisma/client';
import { GroupActionType, ChatGateway } from './chat.gateway';
import {
  CreateGroupDto,
  JoinGroupDto,
  MessageDto,
  UpdateGroupDto,
} from './dto';
import * as bcrypt from 'bcrypt';
import { UserGateway } from 'src/user/user.gateway';

@Injectable()
export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private userRepository: UserRepository,
    private chatGateway: ChatGateway,
    private userGateway: UserGateway,
  ) {}

  async transferOwnership(userId: string, groupId: string, newOwnerId: string) {
    if (userId === newOwnerId) {
      throw new ConflictException("You can't transfer ownership to your self");
    }

    const user = await this.chatRepository.getUserGroup(newOwnerId, groupId);

    if (!user) {
      throw new NotFoundException('User not found in the group');
    }

    await this.chatRepository.transferOwnership(userId, newOwnerId, groupId);
    const members = await this.chatRepository.getGroupMembers(groupId);
    this.chatGateway.sendAction(
      GroupActionType.OWNERSHIP_TRANSFERMED,
      members,
      {
        from: userId,
        to: newOwnerId,
        groupId: groupId,
      },
    );
  }

  async leaveGroup(userId: string, groupId: string) {
    const user = await this.chatRepository.getUserGroup(userId, groupId);

    if (user.role === Role.OWNER) {
      throw new ForbiddenException('You cannot leave the group as the owner');
    }

    const members = await this.chatRepository.getGroupMembers(groupId);
    await this.chatRepository.deleteUserGroup(userId, groupId);
    this.chatGateway.sendAction(GroupActionType.USER_LEAVED, members, {
      userId: userId,
      groupId: groupId,
    });
  }

  async unMuteUser(groupId: string, userToUnMuteId: string) {
    const user = await this.chatRepository.getUserGroup(
      userToUnMuteId,
      groupId,
    );

    if (!user) {
      throw new NotFoundException(
        'User to unmute is not a member of this group',
      );
    }

    if (user.role !== Role.MEMBER_MUTED) {
      throw new ConflictException('User is not muted');
    }

    await this.chatRepository.updateUserGroupRole(
      userToUnMuteId,
      groupId,
      Role.MEMBER,
    );

    const members = await this.chatRepository.getGroupMembers(groupId);
    this.chatGateway.sendAction(GroupActionType.USER_UNMUTED, members, {
      userId: userToUnMuteId,
      groupId: groupId,
    });
  }

  async muteUser(userId: string, groupId: string, userToMuteId: string) {
    const userToMute = await this.chatRepository.getUserGroup(
      userToMuteId,
      groupId,
    );

    if (!userToMute) {
      throw new NotFoundException(`User to mute is not a member of this group`);
    }

    if (userId === userToMuteId) {
      throw new ForbiddenException('You cannot mute yourself!');
    }

    if (userToMute.role === Role.ADMIN) {
      throw new ForbiddenException('You cannot mute other admins');
    }

    if (userToMute.role === Role.MEMBER_MUTED) {
      throw new ConflictException('User is already muted');
    }

    if (userToMute.role == Role.OWNER) {
      throw new ForbiddenException('You cannot mute the owner');
    }

    await this.chatRepository.updateUserGroupRole(
      userToMuteId,
      groupId,
      Role.MEMBER_MUTED,
    );

    const members = await this.chatRepository.getGroupMembers(groupId);
    this.chatGateway.sendAction(GroupActionType.USER_MUTED, members, {
      userId: userToMuteId,
      groupId: groupId,
    });
  }

  async downgradeMember(
    userId: string,
    groupId: string,
    memberToDowngradeId: string,
  ) {
    if (userId === memberToDowngradeId) {
      throw new ForbiddenException('You cannot downgrade yourself');
    }

    const user = await this.chatRepository.getUserGroup(
      memberToDowngradeId,
      groupId,
    );

    if (!user) {
      throw new NotFoundException('User Not found in the group');
    }

    if (user.role === Role.MEMBER) {
      throw new ConflictException('User is already a member');
    }

    await this.chatRepository.updateUserGroupRole(
      memberToDowngradeId,
      groupId,
      Role.MEMBER,
    );

    const members = await this.chatRepository.getGroupMembers(groupId);
    this.chatGateway.sendAction(GroupActionType.USER_DOWNGRADED, members, {
      userId: memberToDowngradeId,
      groupId: groupId,
    });
  }

  async upgradeMember(
    userId: string,
    groupId: string,
    memberToUpgradeId: string,
  ) {
    if (userId === memberToUpgradeId) {
      throw new ForbiddenException('You cannot upgrade yourself');
    }

    const user = await this.chatRepository.getUserGroup(
      memberToUpgradeId,
      groupId,
    );

    if (!user) {
      throw new NotFoundException('User Not found in the group');
    }

    if (user.role === Role.ADMIN) {
      throw new ConflictException('User is already an admin');
    }

    await this.chatRepository.updateUserGroupRole(
      memberToUpgradeId,
      groupId,
      Role.ADMIN,
    );

    const members = await this.chatRepository.getGroupMembers(groupId);
    this.chatGateway.sendAction(GroupActionType.USER_UPGRADED, members, {
      userId: memberToUpgradeId,
      groupId: groupId,
    });
  }

  async unBanFromGroup(groupId: string, userToUnBanId: string) {
    const group = await this.chatRepository.getGroupById(groupId);

    if (!group.bannedUsers.some((user) => user.id === userToUnBanId)) {
      throw new NotFoundException(`User is not banned from this group`);
    }

    await this.userRepository.unBanUserFromGroup(userToUnBanId, groupId);

    const members = await this.chatRepository.getGroupMembers(groupId);
    this.chatGateway.sendAction(GroupActionType.USER_UNBAN, members, {
      userId: userToUnBanId,
      groupId: groupId,
    });
  }

  async banFromGroup(userId: string, groupId: string, userToBanId: string) {
    const user = await this.chatRepository.getUserGroup(userId, groupId);
    const userToBan = await this.chatRepository.getUserGroup(
      userToBanId,
      groupId,
    );

    if (!userToBan) {
      throw new NotFoundException(`User is not a member of this group`);
    }

    if (userId === userToBanId) {
      throw new ForbiddenException('You cannot ban yourself!');
    }

    if (userToBan.role === user.role) {
      throw new ForbiddenException('You cannot ban other admins');
    }

    if (userToBan.role === Role.OWNER) {
      throw new ForbiddenException('You cannot ban the owner');
    }

    const members = await this.chatRepository.getGroupMembers(groupId);
    await this.userRepository.banUserFromGroup(userToBanId, groupId);

    this.chatGateway.sendAction(GroupActionType.USER_BANNED, members, {
      userId: userToBanId,
      groupId: groupId,
    });
  }

  async acceptInvite(userId: string, groupId: string) {
    const groupInvite = await this.chatRepository.getGroupInvite(
      userId,
      groupId,
    );

    if (!groupInvite) {
      throw new NotFoundException('Invite not found');
    }

    await this.chatRepository.acceptGroupInvite(userId, groupId);

    const members = await this.chatRepository.getGroupMembers(groupId);
    const { name } = await this.userRepository.getProfile(userId);
    this.chatGateway.sendAction(GroupActionType.USER_JOINED, members, {
      userId: userId,
      name: name,
      groupId: groupId,
    });
  }

  async inviteToGroup(groupId: string, userId: string, receiverId: string) {
    const group = await this.chatRepository.getGroupById(groupId);
    const receiver = await this.userRepository.getUserById(receiverId);

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    if (!(await this.userRepository.getFriendship(userId, receiverId))) {
      throw new ForbiddenException('user is not your friend');
    }

    if (group.members.some((member) => member.userId === receiverId)) {
      throw new ConflictException('User is already in group');
    }

    if (group.bannedUsers.some((user) => user.id === receiverId)) {
      throw new ForbiddenException('User is banned from group');
    }

    try {
      await this.chatRepository.createGroupInvite(receiverId, groupId);
      this.userGateway.sendGroupInvite(receiverId, groupId, group.name);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Invite already exists');
        }
      }

      throw error;
    }
  }

  async updateGroup(groupId: string, { name, type, password }: UpdateGroupDto) {
    const group = await this.chatRepository.getGroupById(groupId);

    if (type && type === GroupType.PROTECTED && type !== group.type) {
      if (!password) {
        throw new BadRequestException('Password is required to update group');
      }

      password = await bcrypt.hash(password, 10);
    } else {
      password = null;
    }

    try {
      await this.chatRepository.updateGroup(groupId, name, type, password);
      this.chatGateway.sendAction(
        GroupActionType.GROUP_UPDATED,
        group.members,
        {
          groupId: groupId,
          data: { name, type },
        },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Group with this name already exists');
        }
      }

      throw error;
    }
  }

  async sendGroupMessage(
    senderId: string,
    groupId: string,
    { content }: MessageDto,
  ) {
    const group = await this.chatRepository.getGroupById(groupId);

    const message = await this.chatRepository.createGroupMessage(
      senderId,
      groupId,
      content,
    );
    this.chatGateway.sendGroupMessage(group.members, group.name, message);
  }

  async joinGroup(userId: string, groupId: string, { password }: JoinGroupDto) {
    const group = await this.chatRepository.getGroupById(groupId);

    if (!group || group.type === GroupType.PRIVATE) {
      throw new NotFoundException(`Group not found`);
    }

    if (group.members.some((member) => member.userId === userId)) {
      throw new ConflictException('You are already a member of this group');
    }

    if (group.bannedUsers.some((user) => user.id === userId)) {
      throw new ConflictException(`You have been banned from this group`);
    }

    if (group.type === GroupType.PROTECTED) {
      if (!password) {
        throw new BadRequestException('Password is required');
      }

      if (!(await bcrypt.compare(password, group.sensitiveData.password))) {
        throw new ForbiddenException('Invalid password');
      }
    }

    await this.chatRepository.addUserToGroup(userId, groupId);
    const members = await this.chatRepository.getGroupMembers(groupId);
    const { name } = await this.userRepository.getProfile(userId);
    this.chatGateway.sendAction(GroupActionType.USER_JOINED, members, {
      userId: userId,
      name: name,
      groupId: groupId,
    });
  }

  async createGroup(userId: string, { name, type, password }: CreateGroupDto) {
    if (type == GroupType.PROTECTED) {
      if (!password) {
        throw new BadRequestException(
          'Password is required for protected group',
        );
      }

      password = await bcrypt.hash(password, 10);
    } else {
      password = null;
    }

    try {
      const { id: groupId } = await this.chatRepository.createGroup(
        userId,
        name,
        type,
        password,
      );
      const { name: username } = await this.userRepository.getProfile(userId);
      this.chatGateway.sendAction(
        GroupActionType.USER_JOINED,
        [{ userId: userId }],
        {
          userId: userId,
          name: username,
          groupId: groupId,
        },
      );
      const members = [];
      if (type == GroupType.PRIVATE) {
        members.push({ userId: userId });
      }
      this.chatGateway.sendAction(GroupActionType.GROUP_CREATED, members, {
        groupId,
        name,
        type,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Group with this name already exists');
        }
      }

      throw error;
    }
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    { content }: MessageDto,
  ) {
    if (!(await this.userRepository.getUserById(receiverId))) {
      throw new NotFoundException(`User not found`);
    }

    if (!(await this.userRepository.getFriendship(senderId, receiverId))) {
      throw new ForbiddenException(`You are not friends with user`);
    }

    if (await this.userRepository.getBan(senderId, receiverId)) {
      throw new ForbiddenException(`You have banned user`);
    }

    if (await this.userRepository.getBan(receiverId, senderId)) {
      throw new ForbiddenException(`User has banned you`);
    }

    const { name: senderName } = await this.userRepository.getProfile(senderId);
    const { name: receiverName } =
      await this.userRepository.getProfile(receiverId);

    const message = await this.chatRepository.createDmMessage(
      senderId,
      receiverId,
      content,
    );

    this.chatGateway.sendDmMessage(senderName, receiverName, message);
  }

  async getDms(userId: string) {
    const messages = await this.chatRepository.getDms(userId);

    const messagesFiltered = [];
    const dmPast: Set<string> = new Set();

    for (const message of messages) {
      const uniqueKey = `${message.senderId}|${message.receiverId}`;

      if (!dmPast.has(uniqueKey)) {
        dmPast.add(uniqueKey);
        dmPast.add(`${message.receiverId}|${message.senderId}`);
        messagesFiltered.push({
          createAt: message.createdAt,
          id:
            message.senderId == userId ? message.receiverId : message.senderId,
          name:
            message.senderId == userId
              ? message.receiver.profile.name
              : message.sender.profile.name,
          message: message.message,
        });
      }
    }

    return messagesFiltered;
  }

  async getDm(userId: string, pairId: string): Promise<MessageDm[]> {
    if (!(await this.userRepository.getUserById(pairId))) {
      throw new NotFoundException(`User not found`);
    }

    return await this.chatRepository.getDm(userId, pairId);
  }
}
