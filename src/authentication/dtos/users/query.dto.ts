import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '@shared/authorization/enums/role.enum';
import { BaseQueryDto } from '@shared/resource/dtos/base-query.dto';

export class UserQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
