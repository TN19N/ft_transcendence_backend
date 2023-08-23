import { ApiProperty } from '@nestjs/swagger';
import { GroupType } from '@prisma/client';
import {
  IsAlphanumeric,
  IsEnum,
  IsOptional,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateGroupDto {
  @ApiProperty({
    description: 'group name',
    type: String,
    format: 'alphanumeric',
    minLength: 1,
    maxLength: 20,
    example: 'do3afaGroup',
    required: false,
  })
  @IsAlphanumeric()
  @MaxLength(20)
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'group type',
    enum: GroupType,
    example: 'PUBLIC',
    required: false,
  })
  @IsEnum(GroupType)
  @IsOptional()
  type?: GroupType;

  @ApiProperty({
    description: 'password for PROTECTED groups',
    type: String,
    format: 'alphanumeric',
    minLength: 6,
    maxLength: 20,
    example: 'strongPassword',
    required: false,
  })
  @IsAlphanumeric()
  @Length(6, 20)
  @IsOptional()
  password?: string;
}
