import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { ApiTags } from '@nestjs/swagger';
import { Intra42Guard, JwtGuard } from './guard';
import { GetUserId } from './decorator';
import { Response } from 'express';

@Controller('auth')
@ApiTags('auth')
export class AuthenticationController {
  constructor(private authenticationService: AuthenticationService) {}

  @Get('intra42')
  @UseGuards(Intra42Guard)
  async intra42(@GetUserId() userId: string, @Res() response: Response) {
    const loginToken = await this.authenticationService.generateLoginToken(
      userId,
    );
    response.setHeader('Set-Cookie', `Authentication=${loginToken}; Path=/`);
    response.redirect('/home');
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('Authentication');
  }
}
