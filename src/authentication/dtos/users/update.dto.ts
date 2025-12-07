import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@shared/authorization/enums/role.enum';

export class UpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
