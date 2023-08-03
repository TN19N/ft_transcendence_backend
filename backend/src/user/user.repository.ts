import { Injectable } from '@nestjs/common';
import {
  Preferences,
  Prisma,
  Profile,
  SensitiveData,
  User,
} from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UserRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  getUserByIntra42Id(intra42Id: number): Promise<User | null> {
    return this.databaseService.user.findUnique({
      where: {
        intra42Id: intra42Id,
      },
    });
  }

  getUserById(id: string): Promise<User | null> {
    return this.databaseService.user.findUnique({
      where: {
        id: id,
      },
    });
  }

  createNewUser(name: string, intra42Id: number): Promise<User> {
    return this.databaseService.user.create({
      data: {
        intra42Id: intra42Id,
        profile: {
          create: {
            name: name,
          },
        },
        preferences: { create: {} },
        sensitiveData: { create: {} },
      },
    });
  }

  getProfile(id: string): Promise<Profile | null> {
    return this.databaseService.profile.findUnique({
      where: {
        id: id,
      },
    });
  }

  getPreferences(id: string): Promise<Preferences | null> {
    return this.databaseService.preferences.findUnique({
      where: {
        id: id,
      },
    });
  }

  getSensitiveData(id: string): Promise<SensitiveData | null> {
    return this.databaseService.sensitiveData.findUnique({
      where: {
        id: id,
      },
    });
  }

  updateProfile(
    id: string,
    profile: Prisma.ProfileUpdateInput,
  ): Promise<Profile> {
    return this.databaseService.profile.update({
      where: {
        id: id,
      },
      data: profile,
    });
  }

  updatePreferences(
    id: string,
    preferences: Prisma.PreferencesUpdateInput,
  ): Promise<Preferences> {
    return this.databaseService.preferences.update({
      where: {
        id: id,
      },
      data: preferences,
    });
  }

  updateSensitiveData(
    id: string,
    sensitiveData: Prisma.SensitiveDataUpdateInput,
  ) {
    return this.databaseService.sensitiveData.update({
      where: {
        id: id,
      },
      data: sensitiveData,
    });
  }
}
