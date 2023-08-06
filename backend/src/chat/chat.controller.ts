import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { GetUserId } from 'src/authentication/decorator';
import { ChatService } from './chat.service';
import { MessageDto } from './dto';
import { JwtGuard } from 'src/authentication/guard';

@Controller('chat')
@UseGuards(JwtGuard)
@ApiTags('chat')
@ApiCookieAuth('Authentication')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('message')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @GetUserId() userId: string,
    @Body() messageDto: MessageDto,
    @Query('id') id?: string,
  ) {
    if (id) {
      await this.chatService.sendMessage(userId, id, messageDto.content);
    } else {
      throw new BadRequestException("'id' query parameter is required");
    }
  }

  @Get('dm')
  @HttpCode(HttpStatus.OK)
  async getDm(@GetUserId() userId: string, @Query('id') id?: string) {
    if (id) {
      console.log(id);
      return await this.chatService.getDm(userId, id);
    } else {
      throw new BadRequestException("'id' query parameter is required");
    }
  }

  @Get('dms')
  @HttpCode(HttpStatus.OK)
  async getDms(@GetUserId() userId: string) {
    return await this.chatService.getDms(userId);
  }
}
