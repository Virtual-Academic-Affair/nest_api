import { ArrayUnique, IsArray, IsEnum, IsOptional } from 'class-validator';
import { SystemLabel } from '@shared/enums/system-label.enum';

export class UpdateDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(SystemLabel, { each: true })
  labels!: SystemLabel[];
}
