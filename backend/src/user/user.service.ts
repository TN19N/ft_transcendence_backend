import { ConflictException, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import * as QRcode from 'qrcode';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { authenticator } from 'otplib';
import { UpdateProfileDto } from './dto';
import { Prisma, User } from '@prisma/client';
import * as fs from 'fs';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private configurationService: ConfigurationService,
  ) {}

  // for testing purposes
  async addRandomUser(): Promise<User> {
    const randomId = Math.floor(Math.random() * 1000000);
    const user = await this.userRepository.createUser(
      `bot${randomId}`,
      randomId,
    );

    const read = fs.createReadStream('./assets/bot.png');
    const write = fs.createWriteStream(`./upload/${user.id}`);

    read.pipe(write);

    return user;
  }

  async turnOn2fa(userId: string) {
    const sensitiveData = await this.userRepository.getSensitiveData(userId);
    const profile = await this.userRepository.getProfile(userId);

    let secret: string;
    if (sensitiveData.twoFactorAuthenticationSecret && sensitiveData.iv) {
      const { twoFactorAuthenticationSecret, iv } = sensitiveData;

      const ivBuffer = Buffer.from(iv, 'hex');
      const decipher = createDecipheriv(
        'aes-256-cbc',
        this.configurationService.get('ENCRYPT_KEY'),
        ivBuffer,
      );

      secret =
        decipher.update(twoFactorAuthenticationSecret, 'hex', 'utf8') +
        decipher.final('utf8');
    } else {
      secret = authenticator.generateSecret();

      const iv = randomBytes(16);
      const cipher = createCipheriv(
        'aes-256-cbc',
        this.configurationService.get('ENCRYPT_KEY'),
        iv,
      );

      await this.userRepository.updateSensitiveData(userId, {
        twoFactorAuthenticationSecret:
          cipher.update(secret, 'utf-8', 'hex') + cipher.final('hex'),
        iv: iv.toString('hex'),
      });
    }

    return QRcode.toDataURL(
      authenticator.keyuri(profile.name, 'PingPong', secret),
    );
  }

  async turnOff2fa(userId: string) {
    const preferences = await this.userRepository.getPreferences(userId);

    if (preferences.isTwoFactorAuthenticationEnabled == true) {
      await this.userRepository.updatePreferences(userId, {
        isTwoFactorAuthenticationEnabled: false,
      });
      await this.userRepository.updateSensitiveData(userId, {
        twoFactorAuthenticationSecret: null,
        iv: null,
      });
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    try {
      await this.userRepository.updateProfile(userId, updateProfileDto);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('name already exists');
        }
      }
      throw error;
    }
  }
}
