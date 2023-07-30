import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigurationService } from 'src/configuration/configuration.service';

@Injectable()
export class DatabaseService extends PrismaClient {
  constructor(configurationService: ConfigurationService) {
    super({
      datasources: {
        db: {
          url: configurationService.get('DATABASE_URL'),
        },
      },
    });
  }
}
