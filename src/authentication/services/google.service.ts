import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from './auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@authentication/entities/user.entity';
import { Role } from '@shared/authorization/enums/role.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { CodeDto } from '@authentication/dtos/google/code.dto';

@Injectable()
export class GoogleService implements OnModuleInit {
  private oAuthClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly settingService: SettingService,
  ) {}

  onModuleInit() {
    const googleConfig = this.configService.get('google');
    this.oAuthClient = new OAuth2Client(googleConfig);
  }

  generateAuthUrl() {
    return this.oAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'consent',
    });
  }

  async authenticate(dto: CodeDto) {
    // authenticate the user with Google
    const { tokens } = await this.oAuthClient.getToken(dto.code);
    const loginTicket = await this.oAuthClient.verifyIdToken({
      idToken: tokens.id_token,
    });
    const payload = loginTicket.getPayload();

    // determine if the user is an admin
    const adminEmails =
      (await this.settingService.get<string[]>(
        'authentication/admin-emails',
      )) ?? [];
    const isAdmin = adminEmails.includes(payload.email);

    // saving
    let user = await this.userRepository.findOneBy({
      email: payload.email,
    });

    const userData = {
      googleId: payload.sub,
      name: payload.name,
      picture: payload.picture,
      role: isAdmin ? Role.Admin : user?.role,
      email: payload.email,
    };

    if (!user) {
      user = await this.userRepository.save(userData);
    } else {
      await this.userRepository.update(user.id, userData);
    }
    console.log(user);
    return this.authService.generateTokens(user);
  }
}
