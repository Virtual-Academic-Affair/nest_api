import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleapisService } from './googleapis.service';
import { SettingService } from '@shared/setting/services/setting.service';
import { CodeDto } from '../dto/grants/code.dto';

@Injectable()
export class GrantsService {
  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly settingService: SettingService
  ) {}

  generateAuthUrl() {
    const options: any = {
      access_type: 'offline',
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      include_granted_scopes: true,
      prompt: 'consent',
    };
    return this.googleapisService.oAuthClient.generateAuthUrl(options);
  }

  async grant(dto: CodeDto) {
    const { tokens } = await this.googleapisService.oAuthClient.getToken(
      dto.code
    );
    this.googleapisService.oAuthClient.setCredentials(tokens);
    const gmail = google.gmail({
      version: 'v1',
      auth: this.googleapisService.oAuthClient,
    });
    const { data } = await gmail.users.getProfile({ userId: 'me' });

    await this.settingService.set('email/super-email', {
      email: data.emailAddress,
      refreshToken: tokens.refresh_token,
    });

    return;
  }
}
