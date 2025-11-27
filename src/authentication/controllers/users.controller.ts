import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { BaseResourceController } from '@shared/controllers/base-resource.controller';
import { User } from '../entities/user.entity';
import { UsersQueryDto } from '../dto/users/query.dto';
import { UpdateUserDto } from '../dto/users/update.dto';
import { Roles } from '@shared/authorization/decorators/roles.decorator';
import { Role } from '@shared/authorization/enums/role.enum';
import { RestrictMethods } from '@shared/decorators/restrict-methods.decorator';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('authentication/users')
@RestrictMethods({ except: ['delete', 'create'] })
export class UsersController extends BaseResourceController<User> {
  constructor(private readonly usersService: UsersService) {
    super(usersService);
  }

  protected getDtoClasses() {
    return {
      query: UsersQueryDto,
      update: UpdateUserDto,
    };
  }

  @Post('assign-role')
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.usersService.assignRole(assignRoleDto);
  }
}
