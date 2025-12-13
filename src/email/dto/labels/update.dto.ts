import { IsOptional, IsString } from 'class-validator';
import { SystemLabel } from '@shared/enums/system-label.enum';

export class UpdateDto {
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
  [SystemLabel.GraduationInquiry]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.AcademicInquiry]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.Other]?: string | null;
}
