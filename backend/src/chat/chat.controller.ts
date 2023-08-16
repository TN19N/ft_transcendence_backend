import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  Get,
  Body,
  DefaultValuePipe,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { GetUserId } from 'src/authentication/decorator';
import { ChatService } from './chat.service';
import {
  MessageDto,
  CreateGroupDto,
  JoinGroupDto,
  UpdateGroupDto,
} from './dto';
import { JwtGuard } from 'src/authentication/guard';
import { ChatRepository } from './chat.repository';
import { RoleGuard } from './guard';
import { Roles } from './decorator';
import { Role } from '@prisma/client';

@Controller('v1/chat')
@UseGuards(JwtGuard, RoleGuard)
@ApiTags('v1/chat')
@ApiCookieAuth('Authentication')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatRepository: ChatRepository,
  ) {}

  @Delete('group/:groupId/delete')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER)
  async deleteGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    await this.chatRepository.deleteGroup(groupId);
  }

  @Patch('group/:groupId/transferOwnership')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER)
  async transferOwnership(
    @GetUserId() userId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('userToTransferId', ParseUUIDPipe) userToTransferId: string,
  ) {
    await this.chatService.transferOwnership(userId, groupId, userToTransferId);
  }

  @Patch('group/:groupId/leave')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.MEMBER_MUTED)
  async leaveGroup(
    @GetUserId() userId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.chatService.leaveGroup(userId, groupId);
  }

  @Patch('group/:groupId/unMute')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async unMuteUser(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('userToUnMuteId', ParseUUIDPipe) userToUnMuteId: string,
  ) {
    await this.chatService.unMuteUser(groupId, userToUnMuteId);
  }

  @Patch('group/:groupId/mute')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async muteUser(
    @GetUserId() userId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('userToMuteId', ParseUUIDPipe) userToMuteId: string,
  ) {
    await this.chatService.muteUser(userId, groupId, userToMuteId);
  }

  @Get('group/:groupId/members')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.MEMBER_MUTED)
  async getGroupMembers(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return await this.chatRepository.getGroupMembers(groupId);
  }

  @Patch('group/:groupId/downgradeMember')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER)
  async downgradeUser(
    @GetUserId() userId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('userToDowngradeId', ParseUUIDPipe) memberToDowngradeId: string,
  ) {
    await this.chatService.downgradeMember(
      userId,
      groupId,
      memberToDowngradeId,
    );
  }

  @Patch('group/:groupId/upgradeMember')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER)
  async upgradeUser(
    @GetUserId() userId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('userToUpgradeId', ParseUUIDPipe) memberToUpgradeId: string,
  ) {
    await this.chatService.upgradeMember(userId, groupId, memberToUpgradeId);
  }

  @Get('group/:groupId/banned')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async getBannedUsers(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return await this.chatRepository.getBannedUsers(groupId);
  }

  @Patch('group/:groupId/unBan')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async unBanFromGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('userToUnBanId', ParseUUIDPipe) userToUnBanId: string,
  ) {
    await this.chatService.unBanFromGroup(groupId, userToUnBanId);
  }

  @Patch('group/:groupId/ban')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async banFromGroup(
    @GetUserId() userId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('userToBanId', ParseUUIDPipe) userToBanId: string,
  ) {
    await this.chatService.banFromGroup(userId, groupId, userToBanId);
  }

  @Post('group/:groupId/invite')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async inviteToGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('userToInviteId', ParseUUIDPipe) userToInviteId: string,
  ) {
    await this.chatService.inviteToGroup(groupId, userToInviteId);
  }

  @Post('group/:groupId/acceptInvite')
  @HttpCode(HttpStatus.OK)
  async acceptInvite(
    @GetUserId() userId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.chatService.acceptInvite(userId, groupId);
  }

  @Patch('group/:groupId/update')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async updateGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    await this.chatService.updateGroup(groupId, updateGroupDto);
  }

  @Post('group/:groupId/message')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.MEMBER)
  async sendGroupMessage(
    @GetUserId() userId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() messageDto: MessageDto,
  ) {
    await this.chatService.sendGroupMessage(userId, groupId, messageDto);
  }

  @Get('group/:groupId/messages')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.MEMBER_MUTED)
  async getGroup(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.chatRepository.getGroupMessages(groupId);
  }

  @Post('group/:groupId/join')
  @HttpCode(HttpStatus.OK)
  async joinGroup(
    @GetUserId() userId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() joinGroupDto: JoinGroupDto,
  ) {
    await this.chatService.joinGroup(userId, groupId, joinGroupDto);
  }

  @Post('group/create')
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @GetUserId() userId: string,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    await this.chatService.createGroup(userId, createGroupDto);
  }

  @Get('group/search')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'query', required: false })
  searchGroup(
    @GetUserId() userId: string,
    @Query('query', new DefaultValuePipe('')) query: string,
  ) {
    return this.chatRepository.getGroupWithNameStartWith(userId, query);
  }

  @Post('message')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @GetUserId() userId: string,
    @Query('receiverId', ParseUUIDPipe) receiverId: string,
    @Body() messageDto: MessageDto,
  ) {
    await this.chatService.sendMessage(userId, receiverId, messageDto);
  }

  @Get('dm')
  @HttpCode(HttpStatus.OK)
  async getDm(
    @GetUserId() userId: string,
    @Query('pairId', ParseUUIDPipe) pairId?: string,
  ) {
    return await this.chatService.getDm(userId, pairId);
  }

  @Get('dms')
  @HttpCode(HttpStatus.OK)
  async getDms(@GetUserId() userId: string) {
    return await this.chatService.getDms(userId);
  }
}
