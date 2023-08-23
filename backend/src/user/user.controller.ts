import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  ForbiddenException,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiCookieAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetUserId } from 'src/authentication/decorator';
import { JwtGuard } from 'src/authentication/guard';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { TwofaDto, UpdateProfileDto } from './dto';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { createReadStream } from 'fs';
import { join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AchievementType, User } from '@prisma/client';
import { Response } from 'express';
import { GameSpeed } from './user.gateway';

@Controller('v1/user')
@ApiTags('v1/user')
@UseGuards(JwtGuard)
@ApiCookieAuth('Authentication')
export class UserController {
  constructor(
    private userService: UserService,
    private userRepository: UserRepository,
    private authenticationService: AuthenticationService,
  ) {}

  @Get('isFriendRequestSent')
  @HttpCode(HttpStatus.OK)
  async isfriendRequestSent(
    @GetUserId() userId: string,
    @Query('otherId', ParseUUIDPipe) otherId: string,
  ) {
    const otherUser = await this.userRepository.getUserById(otherId);

    if (otherUser) {
      if (await this.userRepository.getFriendRequest(userId, otherId)) {
        return true;
      } else {
        return false;
      }
    } else {
      throw new NotFoundException('user not found');
    }
  }

  @Get('isFriend')
  @HttpCode(HttpStatus.OK)
  async isFriend(
    @GetUserId() userId: string,
    @Query('otherId', ParseUUIDPipe) otherId: string,
  ) {
    const otherUser = await this.userRepository.getUserById(otherId);

    if (otherUser) {
      if (await this.userRepository.getFriendship(userId, otherId)) {
        return true;
      } else {
        return false;
      }
    } else {
      throw new NotFoundException('user not found');
    }
  }

  @Post('sendGameInvite')
  @HttpCode(HttpStatus.OK)
  async sendGameInvite(
    @GetUserId() userId: string,
    @Query('reciverId', ParseUUIDPipe) reciverId: string,
    @Query('speed', new ParseEnumPipe(GameSpeed)) speed: GameSpeed,
  ) {
    await this.userService.sendGameInvite(userId, reciverId, speed);
  }

  @Get('achievement/:achievementType')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'image/png')
  @Header('Content-Disposition', 'inline')
  async getAchievement(
    @Param('achievementType', new ParseEnumPipe(AchievementType))
    achievementType: AchievementType,
  ) {
    return new StreamableFile(
      createReadStream(join(process.cwd(), `./assets/${achievementType}`)),
    );
  }

  @Post('ban')
  @HttpCode(HttpStatus.CREATED)
  async banUser(
    @GetUserId() userId: string,
    @Query('userToBanId', ParseUUIDPipe) userToBanId: string,
  ) {
    await this.userService.banUser(userId, userToBanId);
  }

  @Delete('unBan')
  @HttpCode(HttpStatus.ACCEPTED)
  async unBanUser(
    @GetUserId() userId: string,
    @Query('userToUnBanId', ParseUUIDPipe) userToUnBanId: string,
  ) {
    await this.userService.unBanUser(userId, userToUnBanId);
  }

  @Get('baned')
  @HttpCode(HttpStatus.OK)
  async getBanedUsers(@GetUserId() userId: string) {
    return await this.userRepository.getBanedUsers(userId);
  }

  @Put('acceptFriendRequest')
  @HttpCode(HttpStatus.CREATED)
  async acceptFriendRequest(
    @GetUserId() userId: string,
    @Query('userToFriendId', ParseUUIDPipe) userToFriendId: string,
  ) {
    await this.userService.acceptFriendRequest(userId, userToFriendId);
  }

  @Delete('friendRequest')
  @HttpCode(HttpStatus.ACCEPTED)
  async removefriendRequest(
    @GetUserId() userId: string,
    @Query('senderId', ParseUUIDPipe) senderId: string,
  ) {
    await this.userService.removeFriendRequest(userId, senderId);
  }

  @Delete('friendRequest/sent')
  @HttpCode(HttpStatus.ACCEPTED)
  async removefriendRequestSent(
    @GetUserId() userId: string,
    @Query('reciverId', ParseUUIDPipe) reciverId: string,
  ) {
    await this.userService.removeFriendRequestSent(userId, reciverId);
  }

  @Delete('removeFriend')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFriend(
    @GetUserId() userId: string,
    @Query('friendId', ParseUUIDPipe) friendId: string,
  ) {
    if (await this.userRepository.getFriendship(userId, friendId)) {
      await this.userRepository.deleteFriendship(userId, friendId);
    } else {
      throw new NotFoundException('friend not found');
    }
  }

  @Post('friendRequest')
  @HttpCode(HttpStatus.CREATED)
  async sendFriendRequest(
    @GetUserId() userId: string,
    @Query('userToSendToId', ParseUUIDPipe) userToSendToId: string,
  ) {
    await this.userService.sendFriendRequest(userId, userToSendToId);
  }

  @Get('friendRequest/sent')
  @HttpCode(HttpStatus.OK)
  async getSentFriendRequests(@GetUserId() userId: string) {
    return await this.userRepository.getSentFriendRequests(userId);
  }

  @Get('friendRequest/received')
  @HttpCode(HttpStatus.OK)
  async getReceivedFriendRequests(@GetUserId() userId: string) {
    return await this.userRepository.getReceivedFriendRequests(userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'id', required: false })
  async getUser(@GetUserId() userId: string, @Query('id') id?: string) {
    const user = await this.userRepository.getUserById(id ?? userId);

    if (user) {
      return user;
    } else {
      throw new NotFoundException(`User not found`);
    }
  }

  @Patch('turnOn2fa')
  @HttpCode(HttpStatus.CREATED)
  async turnOn2fa(@GetUserId() userId: string) {
    return await this.userService.turnOn2fa(userId);
  }

  @Patch('turnOff2fa')
  @HttpCode(HttpStatus.CREATED)
  async turnOff2fa(@GetUserId() userId: string) {
    await this.userService.turnOff2fa(userId);
  }

  @Patch('enable2fa')
  @HttpCode(HttpStatus.CREATED)
  async enable2fa(@GetUserId() userId: string, @Body() twoFaDto: TwofaDto) {
    const isValid = await this.authenticationService.validate2fa(
      userId,
      twoFaDto.code,
    );

    if (isValid) {
      await this.userRepository.updatePreferences(userId, {
        isTwoFactorAuthenticationEnabled: true,
      });
    } else {
      throw new ForbiddenException('Wrong two factor authentication code');
    }
  }

  @Get('group/invites')
  @HttpCode(HttpStatus.OK)
  async getGroupInvites(@GetUserId() userId: string) {
    return await this.userRepository.getGroupInvites(userId);
  }

  @Delete('group/invite')
  @HttpCode(HttpStatus.ACCEPTED)
  async removeGroupInvite(
    @GetUserId() userId: string,
    @Query('groupId', ParseUUIDPipe) groupId: string,
  ) {
    const groupInvite = await this.userRepository.getGroupInvite(
      userId,
      groupId,
    );

    if (groupInvite) {
      await this.userRepository.deleteGroupInvite(userId, groupId);
    } else {
      throw new NotFoundException('group invite not found');
    }
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'id', required: false })
  async getProfile(@GetUserId() userId: string, @Query('id') id?: string) {
    const profile = await this.userRepository.getProfile(id ?? userId);

    if (profile) {
      return profile;
    } else {
      throw new NotFoundException(`Profile not found`);
    }
  }

  @Get('preferences')
  @HttpCode(HttpStatus.OK)
  async getPreferences(@GetUserId() userId: string) {
    return await this.userRepository.getPreferences(userId);
  }

  @Put('profile')
  @HttpCode(HttpStatus.CREATED)
  async updateProfile(
    @GetUserId() userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    await this.userService.updateProfile(userId, updateProfileDto);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'query', required: false })
  async search(
    @GetUserId() userId: string,
    @Query('query', new DefaultValuePipe('')) query: string,
  ) {
    return await this.userRepository.getUserWithNameStartingWith(userId, query);
  }

  @Get('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'id', required: false })
  @ApiConsumes('multipart/form-data')
  @Header('Content-Disposition', 'inline')
  async getAvatar(
    @GetUserId() userId: string,
    @Res({ passthrough: true }) response: Response,
    @Query('id') id?: string,
  ) {
    const user = await this.userRepository.getUserById(id ?? userId);

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const { avatarType } = await this.userRepository.getProfile(id ?? userId);

    response.set('Content-Type', avatarType);
    return new StreamableFile(
      createReadStream(join(process.cwd(), `./upload/${user.id}`)),
    );
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: (_, file, callback) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      storage: diskStorage({
        destination: './upload',
        filename: (req, _, callback) => {
          callback(null, (req.user as User).id);
        },
      }),
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadAvatar(
    @GetUserId() userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar file is required in png format');
    }

    await this.userRepository.updateAvatarType(userId, file.mimetype);
  }

  @Get('friends')
  @HttpCode(HttpStatus.OK)
  async getFriends(@GetUserId() userId: string) {
    return await this.userRepository.getFriends(userId);
  }

  @Get('achievements')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'id', required: false })
  async getAchievements(@GetUserId() userId: string, @Query('id') id?: string) {
    const user = await this.userRepository.getUserById(id ?? userId);

    if (user) {
      return await this.userRepository.getAchievements(user.id);
    } else {
      throw new NotFoundException(`User not found`);
    }
  }

  @Get('leaderboard')
  @HttpCode(HttpStatus.OK)
  async getLeaderboard() {
    return await this.userRepository.getLeaderboard();
  }
}

@Controller('v1/test')
@ApiTags('v1/testing')
@ApiCookieAuth('Authentication')
@UseGuards(JwtGuard)
export class TestController {
  constructor(
    private userService: UserService,
    private userRepository: UserRepository,
    private authenticationService: AuthenticationService,
  ) {}

  @Post('addRandomUser')
  @HttpCode(HttpStatus.CREATED)
  async random() {
    return await this.userService.addRandomUser();
  }

  @Get('switchToUser')
  @HttpCode(HttpStatus.OK)
  async switch(
    @Res({ passthrough: true }) response: Response,
    @Query('userToSwitchToId', ParseUUIDPipe) userToSwitchToId: string,
  ) {
    const user = await this.userRepository.getUserById(userToSwitchToId);

    if (user) {
      response.setHeader(
        'Set-Cookie',
        `Authentication=${
          (await this.authenticationService.generateLoginToken(user.id)).token
        }; Path=/`,
      );
    } else {
      throw new NotFoundException(`User not found`);
    }
  }
}
