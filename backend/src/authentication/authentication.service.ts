import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import axios from 'axios';
import { UserRepository } from 'src/user/user.repository';
import * as fs from 'fs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interface';

@Injectable()
export class AuthenticationService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async validateIntra42User(profile: any): Promise<User> {
    const intra42Id: number = parseInt(profile.id);
    let user: User | null = await this.userRepository.getUserByIntra42Id(
      intra42Id,
    );

    if (!user) {
      const username: string = profile.username;
      user = await this.userRepository.createNewUser(username, intra42Id);

      // Get the 42 profile picture
      const profilePictureUrl: string = profile._json.image.link;
      const response = await axios.get(profilePictureUrl, {
        responseType: 'arraybuffer',
      });
      const profilePicture: Buffer = Buffer.from(response.data, 'binary');

      // Save the profile picture in the upload folder
      fs.mkdirSync('./upload');
      await fs.promises.writeFile('./upload/' + user.id, profilePicture);
    }

    return user;
  }

  async validateJwt(payload: JwtPayload): Promise<User | null> {
    return await this.userRepository.getUserById(payload.sub);
  }

  async generateLoginToken(userId: string): Promise<string> {
    const payload: JwtPayload = { sub: userId };
    return await this.jwtService.signAsync(payload);
  }
}
