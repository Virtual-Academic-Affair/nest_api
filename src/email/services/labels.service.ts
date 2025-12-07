import { Injectable } from '@nestjs/common';
import { SettingService } from '@shared/setting/services/setting.service';
import { GoogleapisService } from './googleapis.service';
import { UpdateLabelDto } from '../dto/label/update-label.dto';
import { SystemLabel } from '../enums/system-label.enum';

@Injectable()
export class LabelsService {
  constructor(
    private readonly settingService: SettingService,
    private readonly googleapisService: GoogleapisService,
  ) {}

  async findAllGoogleLabels() {
    const client = await this.googleapisService.getGmailClient();
    const { data } = await client.users.labels.list({ userId: 'me' });
    return (data.labels ?? [])
      .filter((label) => label.type !== 'system')
      .map((label) => ({
        label: label.name,
        value: label.id,
      }));
  }

  async findAll(): Promise<UpdateLabelDto> {
    return await this.settingService.get<UpdateLabelDto>('email/labels');
  }

  async update(mapping: UpdateLabelDto) {
    await this.settingService.set('email/labels', mapping);
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

  async autoCreateLabels(): Promise<UpdateLabelDto> {
    const labels = (await this.findAll()) || ({} as UpdateLabelDto);
    const lang = await this.settingService.get<UpdateLabelDto>(
      'email/lang-labels',
    );

    for (const enumValue of Object.values(SystemLabel)) {
      labels[enumValue] ??= await this.createGmailLabel(lang[enumValue]);
    }

    await this.update(labels);
    return labels;
  }
}
