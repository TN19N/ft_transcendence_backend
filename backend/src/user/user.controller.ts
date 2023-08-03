import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetUserId } from 'src/authentication/decorator';
import { JwtGuard } from 'src/authentication/guard';
import { LoginRedirectFilter } from 'src/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { TwofaDto } from './dto';
import { AuthenticationService } from 'src/authentication/authentication.service';

@Controller('user')
@ApiTags('user')
@UseGuards(JwtGuard)
@ApiCookieAuth('Authentication')
@UseFilters(LoginRedirectFilter)
export class UserController {
  constructor(
    private userService: UserService,
    private userRepository: UserRepository,
    private authenticationService: AuthenticationService,
  ) {}

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
}
