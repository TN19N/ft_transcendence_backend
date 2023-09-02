import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { GoogleGuard, Intra42Guard, Jwt2faGuard, JwtGuard } from './guard';
import { GetUserId } from './decorator';
import { Response } from 'express';
import { TwofaDto } from 'src/user/dto';
import { UserRepository } from 'src/user/user.repository';

@Controller('v1/auth')
@ApiTags('v1/auth')
export class AuthenticationController {
  constructor(
    private authenticationService: AuthenticationService,
    private userRepository: UserRepository,
  ) {}

  @Get('intra42')
  @HttpCode(HttpStatus.TEMPORARY_REDIRECT)
  @UseGuards(Intra42Guard)
  async intra42(
    @GetUserId() userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, twofa } =
      await this.authenticationService.generateLoginToken(userId);
    response.setHeader('Set-Cookie', `Authentication=${token}; Path=/`);

    const { signup } = await this.userRepository.getUserById(userId);
    if (signup) {
      await this.userRepository.updateUser(userId, false);
    }

    if (twofa) {
      response.redirect('/2fa');
    } else if (signup) {
      response.redirect('/signup');
    } else {
      response.redirect('/home');
    }
  }

  @Get('google')
  @HttpCode(HttpStatus.TEMPORARY_REDIRECT)
  @UseGuards(GoogleGuard)
  async google(
    @GetUserId() userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, twofa } =
      await this.authenticationService.generateLoginToken(userId);
    response.setHeader('Set-Cookie', `Authentication=${token}; Path=/`);

    const { signup } = await this.userRepository.getUserById(userId);
    if (signup) {
      await this.userRepository.updateUser(userId, false);
    }

    if (twofa) {
      response.redirect('/2fa');
    } else if (signup) {
      response.redirect('/signup');
    } else {
      response.redirect('/home');
    }
  }

  @Post('2fa')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(Jwt2faGuard)
  @ApiCookieAuth('Authentication')
  async validate2fa(
    @GetUserId() userId: string,
    @Body() twofaDto: TwofaDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const isValid = await this.authenticationService.validate2fa(
      userId,
      twofaDto.code,
    );

    if (isValid) {
      const { token } = await this.authenticationService.generateLoginToken(
        userId,
        false,
      );
      response.setHeader('Set-Cookie', `Authentication=${token}; Path=/`);
    } else {
      throw new ForbiddenException('wrong 2fa code');
    }
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('Authentication')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('Authentication');
  }
}
