import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { SettingService } from '@shared/setting/services/setting.service';
import { SupperEmailSetting } from '../types/super-email-setting.type';

@Injectable()
export class GoogleapisService implements OnModuleInit {
  public oAuthClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly settingService: SettingService,
  ) {}

  onModuleInit() {
    const googleConfig = this.configService.get('google');
    this.oAuthClient = new google.auth.OAuth2(googleConfig);
  }

  async getGmailClient(): Promise<gmail_v1.Gmail> {
    const account = await this.settingService.get<SupperEmailSetting>('email');
    if (!account?.email || !account.refreshToken) {
      throw new Error('Super email not configured');
    }

    const oauthClient = this.oAuthClient;
    oauthClient.setCredentials({ refresh_token: account.refreshToken });
    return google.gmail({ version: 'v1', auth: oauthClient });
  }
}
