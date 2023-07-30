import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getUserByIntra42Id(intra42Id: number): Promise<User | null> {
    return this.databaseService.user.findUnique({
      where: {
        intra42Id: intra42Id,
      },
    });
  }

  async createNewUser(name: string, intra42Id: number): Promise<User> {
    return this.databaseService.user.create({
      data: {
        intra42Id: intra42Id,
        profile: {
          create: {
            name: name,
          },
        },
      },
    });
  }
}
