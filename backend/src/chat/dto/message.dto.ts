import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class MessageDto {
  @ApiProperty({
    description: "the message's content",
    type: String,
    format: 'string',
    minimum: 1,
    maxLength: 1000,
    example: 'Salamo 3alaykom ! 🙂🙂🙂🙂',
  })
  @MaxLength(1000)
  @IsNotEmpty()
  content: string;
}
