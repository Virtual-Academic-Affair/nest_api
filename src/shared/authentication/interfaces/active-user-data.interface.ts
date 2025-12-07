import { Role } from '@shared/authorization/enums/role.enum';

export interface ActiveUserData {
  sub: number;
  email: string;
  role: Role;
}
