import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/authentication/guard';
import { LoginRedirectFilter } from 'src/common';

@Controller('user')
@ApiTags('user')
@UseGuards(JwtGuard)
@UseFilters(LoginRedirectFilter)
export class UserController {
  @Get('test')
  async test() {
    return 'you are allowed to see this';
  }
}
