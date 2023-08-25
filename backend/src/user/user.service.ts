import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import * as QRcode from 'qrcode';
import { ConfigurationService } from 'src/configuration/configuration.service';
import { authenticator } from 'otplib';
import { UpdateProfileDto } from './dto';
import { Prisma, User } from '@prisma/client';
import * as fs from 'fs';
import { GameSpeed, UserGateway } from './user.gateway';

@Injectable()
export class UserService {
  constructor(
    private userGateway: UserGateway,
    private userRepository: UserRepository,
    private configurationService: ConfigurationService,
  ) {}

  async sendGameInvite(userId: string, reciverId: string, speed: GameSpeed) {
    const reciver = await this.userRepository.getUserById(reciverId);

    if (reciver) {
      if (await this.userRepository.getFriendship(userId, reciverId)) {
        this.userGateway.sendGameInvite(reciverId, userId, speed);
      } else {
        throw new ForbiddenException("you can't send game invite to this user");
      }
    } else {
      throw new NotFoundException('User to send to not found!');
    }
  }

  async unBanUser(userId: string, userToUnBanId: string) {
    if (!(await this.userRepository.getBan(userId, userToUnBanId))) {
      throw new ConflictException('user is not banned');
    }

    await this.userRepository.deleteBan(userId, userToUnBanId);
  }

  async banUser(userId: string, userToBanId: string) {
    if (userId === userToBanId) {
      throw new ConflictException('You cannot ban yourself!');
    }

    if (!(await this.userRepository.getUserById(userToBanId))) {
      throw new NotFoundException('user not found');
    }

    try {
      await this.userRepository.createBan(userId, userToBanId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('The ban already exists');
        }
      }

      throw error;
    }
  }

  async acceptFriendRequest(userId: string, senderId: string) {
    const friendRequest = await this.userRepository.getFriendRequest(
      senderId,
      userId,
    );

    if (friendRequest) {
      await this.userRepository.createFriendship(userId, senderId);
    } else {
      throw new NotFoundException(`friendRequest not found`);
    }
  }

  async removeFriendRequest(userId: string, senderId: string) {
    const friendRequest = await this.userRepository.getFriendRequest(
      senderId,
      userId,
    );

    if (friendRequest) {
      await this.userRepository.deletFriendRequest(senderId, userId);
    } else {
      throw new NotFoundException(`friendRequest not found`);
    }
  }

  async removeFriendRequestSent(userId: string, reciverId: string) {
    const friendRequest = await this.userRepository.getFriendRequest(
      userId,
      reciverId,
    );

    if (friendRequest) {
      await this.userRepository.deletFriendRequest(userId, reciverId);
    } else {
      throw new NotFoundException(`friendRequest not found`);
    }
  }

  async sendFriendRequest(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new ConflictException(
        'You cannot send a friend request to yourself',
      );
    }

    if (!(await this.userRepository.getUserById(friendId))) {
      throw new NotFoundException(`user not found`);
    }

    if (await this.userRepository.getFriendship(userId, friendId)) {
      throw new ConflictException('The friendship already exists');
    }

    if (await this.userRepository.getBan(userId, friendId)) {
      throw new ConflictException('You banned the user');
    }

    if (await this.userRepository.getBan(friendId, userId)) {
      throw new ConflictException('The user banned you');
    }

    try {
      await this.userRepository.createFriendRequest(userId, friendId);
      await this.userGateway.sendFriendRequest(userId, friendId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('The friendRequest already exists');
        }
      }

      throw error;
    }
  }

  // for testing purposes
  async addRandomUser(): Promise<User> {
    const randomId = Math.floor(Math.random() * 1000000);
    const user = await this.userRepository.createUser(`bot${randomId}`, {
      intra42Id: randomId,
    });

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
