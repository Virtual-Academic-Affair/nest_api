import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { Role } from '@shared/authorization/enums/role.enum';

export class UpdateUserDto {
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
