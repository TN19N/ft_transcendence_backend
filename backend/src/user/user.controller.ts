import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
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
import { User } from '@prisma/client';
import { Response } from 'express';

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

  @Post('ban')
  @HttpCode(HttpStatus.CREATED)
  async banUser(@GetUserId() userId: string, @Query('id') id?: string) {
    if (id) {
      await this.userService.banUser(userId, id);
    } else {
      throw new BadRequestException("'id' query parameter is required");
    }
  }

  @Post('unBan')
  @HttpCode(HttpStatus.CREATED)
  async unBanUser(@GetUserId() userId: string, @Query('id') id?: string) {
    if (id) {
      await this.userService.unBanUser(userId, id);
    } else {
      throw new BadRequestException("'id' query parameter is required");
    }
  }

  @Get('baned')
  @HttpCode(HttpStatus.OK)
  async getBanedUsers(@GetUserId() userId: string) {
    return await this.userRepository.getBanedUsers(userId);
  }

  @Post('acceptFriendRequest')
  @HttpCode(HttpStatus.CREATED)
  async acceptFriendRequest(
    @GetUserId() userId: string,
    @Query('id') senderId?: string,
  ) {
    if (senderId) {
      await this.userService.acceptFriendRequest(userId, senderId);
    } else {
      throw new BadRequestException("'id' query parameter is required");
    }
  }

  @Post('friendRequest')
  @HttpCode(HttpStatus.CREATED)
  async sendFriendRequest(
    @GetUserId() userId: string,
    @Query('id') friendId?: string,
  ) {
    if (friendId) {
      await this.userService.sendFriendRequest(userId, friendId);
    } else {
      throw new BadRequestException("'id' query parameter is required");
    }
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
      throw new NotFoundException(`User with id ${id ?? userId} not found`);
    }
  }

  @Post('turnOn2fa')
  @HttpCode(HttpStatus.CREATED)
  async turnOn2fa(@GetUserId() userId: string) {
    return await this.userService.turnOn2fa(userId);
  }

  @Post('turnOff2fa')
  @HttpCode(HttpStatus.CREATED)
  async turnOff2fa(@GetUserId() userId: string) {
    await this.userService.turnOff2fa(userId);
  }

  @Post('enable2fa')
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

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'id', required: false })
  async getProfile(@GetUserId() userId: string, @Query('id') id?: string) {
    const profile = await this.userRepository.getProfile(id ?? userId);

    if (profile) {
      return profile;
    } else {
      throw new NotFoundException(`Profile with id ${id ?? userId} not found`);
    }
  }

  @Get('preferences')
  @HttpCode(HttpStatus.OK)
  async getPreferences(@GetUserId() userId: string) {
    return await this.userRepository.getPreferences(userId);
  }

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  async updateProfile(
    @GetUserId() userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    await this.userService.updateProfile(userId, updateProfileDto);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
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
  async getAvatar(
    @GetUserId() userId: string,
    @Res({ passthrough: true }) response: Response,
    @Query('id') id?: string,
  ) {
    const user = await this.userRepository.getUserById(id ?? userId);

    if (!user) {
      throw new NotFoundException(`User with id ${id ?? userId} not found`);
    }

    const { avatarType } = await this.userRepository.getProfile(id ?? userId);

    response.set('Content-Type', avatarType);
    response.set('Content-Disposition', 'inline');

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
    @Query('id') id?: string,
  ) {
    if (id) {
      const user = await this.userRepository.getUserById(id);

      if (user) {
        response.setHeader(
          'Set-Cookie',
          `Authentication=${
            (await this.authenticationService.generateLoginToken(user.id)).token
          }; Path=/`,
        );
      } else {
        throw new NotFoundException(`User with id ${id} not found`);
      }
    } else {
      throw new BadRequestException("'id' query parameter is required");
    }
  }
}
