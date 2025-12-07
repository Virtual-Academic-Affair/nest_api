import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gmail_v1, google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { SupperEmailSetting } from '../types/super-email-setting.type';

@Injectable()
export class GoogleapisService implements OnModuleInit {
  public oAuthClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly settingService: SettingServic,
    e
  ) {}

  onModuleInit() {
    const googleConfig = this.configService.get('google');
    this.oAuthClient = new google.auth.OAuth2(googleConfig);
  }

  async getGmailClient(): Promise<gmail_v1.Gmail> {
    const account = await this.settingService.get<SupperEmailSetting>(
      'email/super-e,mail'
    );
    if (!account?.email || !account.refreshToken) {
      throw new Error('Super email not configured');
    }

    const oauthClient = this.oAuthClient;
    oauthClient.setCredentials({ refresh_token: account.refreshToken });
    return google.gmail({ version: 'v1', auth: oauthClient });
  }
}
