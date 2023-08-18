import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetUserId } from 'src/authentication/decorator';
import { JwtGuard } from 'src/authentication/guard';
import { GameRepository } from './game.repository';
import { UserRepository } from 'src/user/user.repository';

@Controller('v1/game')
@ApiTags('v1/game')
@UseGuards(JwtGuard)
@ApiCookieAuth('Authentication')
export class GameController {
  constructor(
    private gameRepository: GameRepository,
    private userRepository: UserRepository,
  ) {}

  @Get('record')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'id', required: false })
  async getGameRecord(@GetUserId() userId: string, @Query('id') id?: string) {
    const user = await this.userRepository.getUserById(id ?? userId);

    if (user) {
      return (await this.gameRepository.getRecord(user.id)).map((record) => {
        return {
          ...record,
          userName: record.user.profile.name,
          opponentName: record.opponent.profile.name,
          user: undefined,
          opponent: undefined,
        };
      });
    } else {
      throw new NotFoundException('User not found');
    }
  }
}
