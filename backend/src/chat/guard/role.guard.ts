import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ChatRepository } from '../chat.repository';
import { Role, User } from '@prisma/client';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private chatRepository: ChatRepository,
  ) {}

  private rolesPriority = [
    Role.MEMBER_MUTED,
    Role.MEMBER,
    Role.ADMIN,
    Role.OWNER,
  ];

  async canActivate(context: ExecutionContext) {
    const role = this.reflector.get<Role>('role', context.getHandler());

    if (!role) return true;

    const request = context.switchToHttp().getRequest();
    const groupId = request.params.groupId;
    const userId = (request.user as User).id;

    const user = await this.chatRepository.getUserGroup(userId, groupId);

    if (!user) return false;

    return (
      this.rolesPriority.indexOf(user.role) >= this.rolesPriority.indexOf(role)
    );
  }
}
