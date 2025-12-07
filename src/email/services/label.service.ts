import { Injectable } from '@nestjs/common';
import { SettingService } from '@shared/setting/services/setting.service';
import { GoogleapisService } from './googleapis.service';
import { LabelDto } from '../dto/label/label.dto';
import { SystemLabel } from '../enums/system-label.enum';

@Injectable()
export class LabelService {
  constructor(
    private readonly settingService: SettingService,
    private readonly googleapisService: GoogleapisService,
  ) {}

  async getGoogleLabels() {
    const client = await this.googleapisService.getGmailClient();
    const { data } = await client.users.labels.list({ userId: 'me' });
    return (data.labels ?? [])
      .filter((label) => label.type !== 'system')
      .map((label) => ({
        label: label.name,
        value: label.id,
      }));
  }

  async getLabels(): Promise<LabelDto> {
    return await this.settingService.get<LabelDto>('email/labels');
  }

  async updateLabels(mapping: LabelDto) {
    await this.settingService.set('label', mapping);
  }

  private async createGmailLabel(name: string): Promise<string> {
    const client = await this.googleapisService.getGmailClient();
    const { data } = await client.users.labels.create({
      userId: 'me',
      requestBody: { name },
    });

    if (!data?.id) {
      throw new Error(`Failed to create label: ${name}`);
    }

    return data.id;
  }

  async autoCreateLabels(): Promise<LabelDto> {
    const labels = (await this.getLabels()) || ({} as LabelDto);
    const lang = await this.settingService.get<LabelDto>('email/lang-labels');

    for (const enumValue of Object.values(SystemLabel)) {
      labels[enumValue] ??= await this.createGmailLabel(lang[enumValue]);
    }

    await this.updateLabels(labels);
    return labels;
  }
}
