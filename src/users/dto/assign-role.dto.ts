import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../enums/role.enum';

export class AssignRoleDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
