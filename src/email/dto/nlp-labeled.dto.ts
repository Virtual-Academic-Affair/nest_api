import {
  ArrayUnique,
  IsArray,
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SystemLabel } from '@shared/enums/system-label.enum';

export class NlpLabeledInternalDto {
  @IsDefined()
  @IsNumber()
  id!: number;

  @IsDefined()
  @IsString()
  gmailMessageId!: string;
}

export class NlpLabeledDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => NlpLabeledInternalDto)
  internal!: NlpLabeledInternalDto;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(SystemLabel, { each: true })
  labels?: SystemLabel[];
}
