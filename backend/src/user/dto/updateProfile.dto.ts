import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: "The user's name",
    type: String,
    format: 'alphanumeric',
    minLength: 1,
    maxLength: 10,
    example: 'user42',
  })
  @IsAlphanumeric()
  @MaxLength(10)
  name: string;
}
