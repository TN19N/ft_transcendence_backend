import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Res,
  StreamableFile,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCookieAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetUserId } from 'src/authentication/decorator';
import { JwtGuard } from 'src/authentication/guard';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { TwofaDto, UpdateProfileDto } from './dto';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { User } from '@prisma/client';

@Controller('user')
@ApiTags('user')
@UseGuards(JwtGuard)
@ApiCookieAuth('Authentication')
export class UserController {
  constructor(
    private userService: UserService,
    private userRepository: UserRepository,
    private authenticationService: AuthenticationService,
  ) {}

  @Post('random')
  @HttpCode(HttpStatus.CREATED)
  @ApiTags('testing')
  async random() {
    return await this.userService.addRandomUser();
  }

  @Get('switch')
  @HttpCode(HttpStatus.OK)
  @ApiTags('testing')
  async switch(
    @Res({ passthrough: true }) response: Response,
    @Query('id') id?: string,
  ) {
    if (id) {
      const user = await this.userRepository.getUserById(id);

      if (user) {
        response.setHeader(
          'Set-Cookie',
          `Authentication=${await this.authenticationService.generateLoginToken(
            user.id,
          )}; Path=/`,
        );
      } else {
        throw new NotFoundException(`User with id ${id} not found`);
      }
    } else {
      throw new BadRequestException("'id' query parameter is required");
    }
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
      throw new UnauthorizedException('Wrong two factor authentication code');
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
  async search(@Query('query') query: string) {
    if (query) {
      return await this.userRepository.getUserWithNameStartingWith(query);
    } else {
      throw new BadRequestException("'query' query parameter is required");
    }
  }

  @Get('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'id', required: false })
  @Header('Content-Type', 'image/png')
  @Header('Content-Disposition', 'attachment; filename=avatar.png')
  async getAvatar(@GetUserId() userId: string, @Query('id') id?: string) {
    const user = await this.userRepository.getUserById(id ?? userId);

    if (!user) {
      throw new NotFoundException(`User with id ${id ?? userId} not found`);
    }

    return new StreamableFile(
      createReadStream(join(process.cwd(), `./upload/${user.id}`)),
    );
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: (req, file, callback) => {
        if (file.mimetype === 'image/png') {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      storage: diskStorage({
        destination: './upload',
        filename: (req, file, callback) => {
          callback(null, (req.user as User).id);
        },
      }),
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Avatar file is required in png format');
    }
  }
}
