import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import axios from 'axios';
import { UserRepository } from 'src/user/user.repository';
import * as fs from 'fs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interface';
import { createDecipheriv } from 'crypto';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { authenticator } from 'otplib';

@Injectable()
export class AuthenticationService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private configurationService: ConfigurationService,
  ) {}

  async validateIntra42User(profile: any): Promise<User> {
    const intra42Id: number = parseInt(profile.id);
    let user: User | null = await this.userRepository.getUserByIntra42Id(
      intra42Id,
    );

    if (!user) {
      const username: string = profile.username;
      user = await this.userRepository.createUser(username, intra42Id);

      // Get the 42 profile picture
      const profilePictureUrl: string = profile._json.image.link;
      const response = await axios.get(profilePictureUrl, {
        responseType: 'arraybuffer',
      });
      const profilePicture: Buffer = Buffer.from(response.data, 'binary');

      // Save the profile picture in the upload folder
      if (!fs.existsSync('./upload')) {
        fs.mkdirSync('./upload');
      }
      await fs.promises.writeFile('./upload/' + user.id, profilePicture);
    }

    return user;
  }

  async validatePayload(payload: JwtPayload): Promise<User | null> {
    return await this.userRepository.getUserById(payload.sub);
  }

  async validateJwt(jwtToken: string): Promise<JwtPayload | null> {
    try {
      return await this.jwtService.verifyAsync(jwtToken);
    } catch (_) {
      return null;
    }
  }

  async validate2fa(userId: string, twofaCode: string): Promise<boolean> {
    const sensitiveData = await this.userRepository.getSensitiveData(userId);

    let isValid = false;
    if (sensitiveData.twoFactorAuthenticationSecret && sensitiveData.iv) {
      const { twoFactorAuthenticationSecret, iv } = sensitiveData;

      const ivBuffer = Buffer.from(iv, 'hex');
      const decipher = createDecipheriv(
        'aes-256-cbc',
        this.configurationService.get('ENCRYPT_KEY'),
        ivBuffer,
      );

      const secret =
        decipher.update(twoFactorAuthenticationSecret, 'hex', 'utf-8') +
        decipher.final('utf-8');

      isValid = authenticator.verify({
        token: twofaCode,
        secret: secret,
      });
    }

    return isValid;
  }

  async generateLoginToken(
    userId: string,
    is2faEnabled: boolean | undefined = undefined,
  ): Promise<{ token: string; twofa: boolean }> {
    if (is2faEnabled === undefined) {
      const preferences = await this.userRepository.getPreferences(userId);
      is2faEnabled = preferences.isTwoFactorAuthenticationEnabled;
    }

    const payload: JwtPayload = { sub: userId, tfa: is2faEnabled };
    return {
      token: await this.jwtService.signAsync(payload),
      twofa: is2faEnabled,
    };
  }
}
