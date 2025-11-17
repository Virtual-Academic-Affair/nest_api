import { IsOptional, IsEnum } from 'class-validator';
import { Role } from '@shared/authorization/enums/role.enum';
import { BaseQueryDto } from '@shared/dto/base-query.dto';

export class UsersQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
