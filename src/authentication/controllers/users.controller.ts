import { Controller } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { Roles } from '@shared/authorization/decorators/roles.decorator';
import { Role } from '@shared/authorization/enums/role.enum';

@ApiTags('Users')
@ApiBearerAuth('jwt')
@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
}
