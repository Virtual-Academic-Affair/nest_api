import { IsOptional, IsEnum } from 'class-validator';
import { Role } from '@shared/authorization/enums/role.enum';
import { BaseQueryDto } from '@shared/base-resource/dtos/base-query.dto';

export class UserQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
