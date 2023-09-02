import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class JoinGroupDto {
  @ApiProperty({
    description: 'password for PROTECTED groups',
    type: String,
    format: 'alphanumeric',
    minLength: 6,
    maxLength: 20,
    example: 'strongPassword',
  })
  @IsOptional()
  password?: string;
}
