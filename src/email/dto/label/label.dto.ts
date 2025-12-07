import { IsString, IsOptional } from 'class-validator';
import { SystemLabel } from '../../enums/system-label.enum';

export class LabelDto {
  @IsOptional()
  @IsString()
  [SystemLabel.ClassRegistration]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.Administrative]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.Department]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.Inquiry]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.Graduation]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.Academic]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.Other]?: string | null;
}
