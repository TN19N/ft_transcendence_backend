import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import * as QRcode from 'qrcode';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { authenticator } from 'otplib';
import { Profile } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private configurationService: ConfigurationService,
  ) {}

  async turnOn2fa(userId: string) {
    const sensitiveData = await this.userRepository.getUserSensitiveData(
      userId,
    );
    const profile = await this.userRepository.getUserProfile(userId);

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

      this.userRepository.updateSensitiveData(userId, {
        twoFactorAuthenticationSecret: secret,
        iv: randomBytes(16).toString('hex'),
      } as Profile);
    }

    return QRcode.toDataURL(
      authenticate.keyuri(profile.name, 'PingPong', secret),
    );
  }
}
