import { Injectable } from '@nestjs/common';
import { SettingService } from '@shared/setting/services/setting.service';
import { GoogleapisService } from './googleapis.service';
import { LabelDto } from '../dto/label/label.dto';

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
    return await this.settingService.get<LabelDto>('label');
  }

  async updateLabels(mapping: LabelDto) {
    await this.settingService.updateOrCreate('label', mapping);
  }
}
