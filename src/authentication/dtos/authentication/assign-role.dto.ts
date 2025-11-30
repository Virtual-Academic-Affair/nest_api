import { IsEmail, IsEnum } from 'class-validator';
import { Role } from '@shared/authorization/enums/role.enum';

export class AssignRoleDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;
}
