import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '@shared/authorization/enums/role.enum';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class UserDto extends ResourceQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
