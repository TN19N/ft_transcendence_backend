import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { ApiTags } from '@nestjs/swagger';
import { Intra42Guard } from './guard';
import { GetUserId } from './decorator';
import { Response } from 'express';

@Controller('auth')
@ApiTags('auth')
export class AuthenticationController {
  constructor(private authenticationService: AuthenticationService) {}

  @Get('intra42')
  @UseGuards(Intra42Guard)
  intra42(@GetUserId() userId: string, @Res() response: Response) {
    const loginToken = this.authenticationService.generateLoginToken(userId);
    response.setHeader('Set-Cookie', `Authentication=${loginToken}; HttpOnly`);
    response.redirect('/home');
  }
}
