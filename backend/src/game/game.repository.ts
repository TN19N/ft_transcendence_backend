import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class GameRepository {
  constructor(private databaseService: DatabaseService) {}

  getRecord(userId: string) {
    return this.databaseService.gameRecord.findMany({
      where: { userId: userId },
      include: {
        user: {
          select: {
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
        opponent: {
          select: {
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
