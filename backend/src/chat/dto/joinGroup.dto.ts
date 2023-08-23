import { ApiProperty } from '@nestjs/swagger';
import { IsAlphanumeric, IsOptional, Length } from 'class-validator';

export class JoinGroupDto {
  @ApiProperty({
    description: 'password for PROTECTED groups',
    type: String,
    format: 'alphanumeric',
    minLength: 6,
    maxLength: 20,
    example: 'strongPassword',
  })
  @IsAlphanumeric()
  @Length(6, 20)
  @IsOptional()
  password?: string;
}
