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
    example: 'do3afaGroup',
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
    example: 'myStrongPassword',
  })
  @IsAlphanumeric()
  @Length(6, 20)
  @IsOptional()
  password?: string;
}
