import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async get<T = any>(key: string): Promise<T | null> {
    const setting = await this.settingRepository.findOne({
      where: { key: key.toUpperCase() },
    });

    return setting ? (setting.value as T) : null;
  }

  async update(key: string, value: any, isPartial = true): Promise<Setting> {
    const upperKey = key.toUpperCase();
    let setting = await this.settingRepository.findOne({
      where: { key: upperKey },
    });

    if (!setting) {
      setting = this.settingRepository.create({
        key: upperKey,
        value: null,
      });
    }

    if (
      isPartial &&
      setting.value &&
      typeof setting.value === 'object' &&
      typeof value === 'object' &&
      !Array.isArray(setting.value) &&
      !Array.isArray(value)
    ) {
      setting.value = { ...setting.value, ...value };
    } else {
      setting.value = value;
    }

    return await this.settingRepository.save(setting);
  }
}
