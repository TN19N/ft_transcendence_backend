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
import { ChatGateway } from './chat.gateway';
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
  }

  async leaveGroup(userId: string, groupId: string) {
    const user = await this.chatRepository.getUserGroup(userId, groupId);

    if (user.role === Role.OWNER) {
      throw new ForbiddenException('You cannot leave the group as the owner');
    }

    await this.chatRepository.deleteUserGroup(userId, groupId);
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
  }

  async muteUser(userId: string, groupId: string, userToMuteId: string) {
    const user = await this.chatRepository.getUserGroup(userId, groupId);
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

    if (user.role === userToMute.role) {
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
  }

  async unBanFromGroup(groupId: string, userToUnBanId: string) {
    const group = await this.chatRepository.getGroupById(groupId);

    if (!group.bannedUsers.some((user) => user.id === userToUnBanId)) {
      throw new NotFoundException(
        `User with id ${userToUnBanId} is not banned from this group`,
      );
    }

    await this.userRepository.unBanUserFromGroup(userToUnBanId, groupId);
  }

  async banFromGroup(userId: string, groupId: string, userToBanId: string) {
    const userToBan = await this.chatRepository.getUserGroup(
      userToBanId,
      groupId,
    );

    if (!userToBan) {
      throw new NotFoundException(
        `User with id ${userToBanId} is not a member of this group`,
      );
    }

    if (userId === userToBanId) {
      throw new ForbiddenException('You cannot ban yourself!');
    }

    if (userToBan.role === Role.ADMIN) {
      throw new ForbiddenException('You cannot ban other admins');
    }

    if (userToBan.role === Role.OWNER) {
      throw new ForbiddenException('You cannot ban the owner');
    }

    await this.userRepository.banUserFromGroup(userToBanId, groupId);
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
  }

  async inviteToGroup(groupId: string, receiverId: string) {
    const group = await this.chatRepository.getGroupById(groupId);
    const receiver = await this.userRepository.getUserById(receiverId);

    if (!receiver) {
      throw new NotFoundException(`User with id ${receiver} not found`);
    }

    if (group.members.some((member) => member.userId === receiverId)) {
      throw new ConflictException('User is already in group');
    }

    if (group.bannedUsers.some((user) => user.id === receiverId)) {
      throw new ForbiddenException('User is banned from group');
    }

    try {
      await this.chatRepository.createGroupInvite(receiverId, groupId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Invite already exists');
        }
      }

      throw error;
    }

    this.userGateway.sendGroupInvite(receiverId, groupId);
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

    await this.chatRepository.createGroupMessage(senderId, groupId, content);
    this.chatGateway.sendGroupMessage(
      group.members,
      groupId,
      senderId,
      content,
    );
  }

  async joinGroup(userId: string, groupId: string, { password }: JoinGroupDto) {
    const group = await this.chatRepository.getGroupById(groupId);

    if (!group || group.type === GroupType.PRIVATE) {
      throw new NotFoundException(`Group with id ${groupId} not found`);
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
      await this.chatRepository.createGroup(userId, name, type, password);
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
      throw new NotFoundException(`User with id ${receiverId} not found`);
    }

    if (!(await this.userRepository.getFriendship(senderId, receiverId))) {
      throw new ForbiddenException(
        `You are not friends with user with id ${receiverId}`,
      );
    }

    if (await this.userRepository.getBan(senderId, receiverId)) {
      throw new ForbiddenException(
        `You have banned user with id ${receiverId}`,
      );
    }

    if (await this.userRepository.getBan(receiverId, senderId)) {
      throw new ForbiddenException(`User with id ${receiverId} has banned you`);
    }

    await this.chatRepository.createDmMessage(senderId, receiverId, content);
    this.chatGateway.sendDmMessage(senderId, receiverId, content);
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
      throw new NotFoundException(`User with id ${pairId} not found`);
    }

    return await this.chatRepository.getDm(userId, pairId);
  }
}
