import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { GameSpeed } from 'src/user/user.gateway';

export class InvitationDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsEnum(GameSpeed)
  @IsOptional()
  speed?: string;
}
