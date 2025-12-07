import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { BaseQueryDto } from '@shared/base-resource/dtos/base-query.dto';
import { SystemLabel } from '../../enums/system-label.enum';

export class MessageQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(SystemLabel)
  systemLabel?: string;
}
