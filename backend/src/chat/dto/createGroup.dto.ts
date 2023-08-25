import { ApiProperty } from '@nestjs/swagger';
import { GroupType } from '@prisma/client';
import {
  IsAlphanumeric,
  IsEnum,
  IsOptional,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'group name',
    type: String,
    format: 'alphanumeric',
    minLength: 1,
    maxLength: 10,
    example: 'Group12',
  })
  @IsAlphanumeric()
  @MaxLength(10)
  name: string;

  @ApiProperty({
    description: 'group type',
    enum: GroupType,
    example: 'PUBLIC',
  })
  @IsEnum(GroupType)
  type: GroupType;

  @ApiProperty({
    description: 'password for PROTECTED groups',
    type: String,
    format: 'alphanumeric',
    minLength: 6,
    maxLength: 20,
    example: 'password',
  })
  @IsAlphanumeric()
  @Length(6, 20)
  @IsOptional()
  password?: string;
}
