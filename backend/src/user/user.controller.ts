import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetUserId } from 'src/authentication/decorator';
import { JwtGuard } from 'src/authentication/guard';
import { LoginRedirectFilter } from 'src/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

@Controller('user')
@ApiTags('user')
@UseGuards(JwtGuard)
@UseFilters(LoginRedirectFilter)
export class UserController {
  constructor(
    private userService: UserService,
    private userRepository: UserRepository,
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
}
