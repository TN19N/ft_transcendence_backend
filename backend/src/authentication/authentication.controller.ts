import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Intra42Guard, Jwt2faGuard, JwtGuard } from './guard';
import { GetUserId } from './decorator';
import { Response } from 'express';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { TwofaDto } from 'src/user/dto';

@Controller('auth')
@ApiTags('auth')
export class AuthenticationController {
  constructor(
    private authenticationService: AuthenticationService,
    private configurationService: ConfigurationService,
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

    if (twofa) {
      response.redirect(this.configurationService.get('FRONTEND_URL') + '/2fa');
    } else {
      response.redirect(
        this.configurationService.get('FRONTEND_URL') + '/home',
      );
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
      const loginToken = await this.authenticationService.generateLoginToken(
        userId,
        false,
      );
      response.setHeader('Set-Cookie', `Authentication=${loginToken}; Path=/`);
      response.redirect(
        this.configurationService.get('FRONTEND_URL') + '/home',
      );
    } else {
      throw new UnauthorizedException('wrong 2fa code');
    }
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('Authentication')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('Authentication');
    response.redirect(this.configurationService.get('FRONTEND_URL') + '/login');
  }
}
