import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { UserRepository } from 'src/user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interface';
import { createDecipheriv } from 'crypto';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { authenticator } from 'otplib';
import axios from 'axios';
import * as fs from 'fs';
import { Socket } from 'socket.io';
import { parse } from 'cookie';

@Injectable()
export class AuthenticationService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private configurationService: ConfigurationService,
  ) {}

  async createNewUser(
    id: { intra42Id?: number; googleId?: string },
    username?: string,
    avatar_link?: string,
  ): Promise<User> {
    let user: User;
    while (true) {
      if (!username) {
        username = 'user' + Math.floor(Math.random() * 1000000);
      }

      try {
        user = await this.userRepository.createUser(username, id);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            username += Math.floor(Math.random() * 10);
            continue;
          }
        }

        throw error;
      }
      break;
    }

    let profilePicture: Buffer;
    if (avatar_link) {
      const response = await axios.get(avatar_link, {
        responseType: 'arraybuffer',
      });

      profilePicture = Buffer.from(response.data, 'binary');
    } else {
      profilePicture = await fs.promises.readFile('./assets/avatar.png');
    }

    if (!fs.existsSync('./upload')) {
      fs.mkdirSync('./upload');
    }

    await fs.promises.writeFile('./upload/' + user.id, profilePicture);

    return user;
  }

  async validateGoogleUser(profile: any): Promise<User> {
    let user: User | null = await this.userRepository.getUserByGoogleId(
      profile.id,
    );

    if (!user) {
      user = await this.createNewUser(
        { googleId: profile.id },
        profile?.displayName,
        profile?.photos[0]?.value,
      );
    }

    return user;
  }

  async validateIntra42User(profile: any): Promise<User> {
    const intra42Id: number = parseInt(profile.id);
    let user: User | null =
      await this.userRepository.getUserByIntra42Id(intra42Id);

    if (!user) {
      user = await this.createNewUser(
        { intra42Id: intra42Id },
        profile?.username,
        profile?._json?.image?.link,
      );
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

  async validateJwtWbSocket(socket: Socket): Promise<string | null> {
    if (!socket.handshake.headers.cookie) {
      return null;
    }

    const jwtToken = parse(socket.handshake.headers.cookie).Authentication;
    if (jwtToken) {
      const payload: JwtPayload = await this.validateJwt(jwtToken);

      if (payload && payload.tfa == false) {
        return (await this.validatePayload(payload))?.id;
      }
    }

    return null;
  }
}
