import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/authentication/guard';

@Controller('user')
export class UserController {
  @Get('test')
  @UseGuards(JwtGuard)
  async test() {
    return 'you are allowed to see this';
  }
}
