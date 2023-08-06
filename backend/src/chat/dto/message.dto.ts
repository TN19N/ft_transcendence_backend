import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';

export class MessageDto {
  @ApiProperty({
    description: "the message's content",
    type: String,
    format: 'string',
    maxLength: 1000,
    example: 'Salamo 3alaykom ! 🙂🙂🙂🙂',
  })
  @MaxLength(1000)
  content: string;
}
