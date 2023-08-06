import { Injectable } from '@nestjs/common';
import { GameRecord } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class GameRepository {
  constructor(private databaseService: DatabaseService) {}

  getRecord(userId: string): Promise<GameRecord[]> {
    return this.databaseService.gameRecord.findMany({
      where: {
        userId: userId,
      },
    });
  }
}
