import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthenticationService } from './authentication.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@authentication/entities/user.entity';
import { Role } from '@shared/authorization/enums/role.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class GoogleAuthenticationService implements OnModuleInit {
  private oAuthClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthenticationService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly settingService: SettingService,
  ) {}

  onModuleInit() {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');
    this.oAuthClient = new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  async authenticate(code: string) {
    const { tokens } = await this.oAuthClient.getToken(code);

    const loginTicket = await this.oAuthClient.verifyIdToken({
      idToken: tokens.id_token,
    });
    const payload = loginTicket.getPayload();

    const authSetting = await this.settingService.get<{
      adminEmails: string[];
    }>('authentication');

    const adminEmails = authSetting?.adminEmails ?? [];
    const isAdmin = adminEmails.includes(payload.email);

    let user = await this.userRepository.findOneBy({
      email: payload.email,
    });

    const userData = {
      googleId: payload.sub,
      name: payload.name,
      picture: payload.picture,
      role: isAdmin ? Role.Admin : Role.Student,
    };

    if (!user) {
      user = this.userRepository.create({
        email: payload.email,
        ...userData,
      });
    } else {
      Object.assign(user, userData);
    }

    await this.userRepository.save(user);

    return this.authService.generateTokens(user);
  }
}
