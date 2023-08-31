import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionsFilter extends BaseWsExceptionFilter {
  catch(_: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    client.emit('error', 'Unauthorized');
    client.disconnect();
  }
}
