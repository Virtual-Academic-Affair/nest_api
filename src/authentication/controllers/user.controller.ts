import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { AssignRoleDto } from '@authentication/dtos/authentication/assign-role.dto';
import { BaseResourceController } from '@shared/base-resource/controllers/base-resource.controller';
import { User } from '../entities/user.entity';
import { UserQueryDto } from '@authentication/dtos/user/query.dto';
import { UpdateUserDto } from '@authentication/dtos/user/update.dto';
import { Roles } from '@shared/authorization/decorators/roles.decorator';
import { Role } from '@shared/authorization/enums/role.enum';
import { RestrictMethods } from '@shared/base-resource/decorators/restrict-methods.decorator';
import { ResourceAction } from '@shared/base-resource/enums/resource-action.enum';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('authentication/user')
@RestrictMethods({ except: [ResourceAction.Create, ResourceAction.Delete] })
export class UserController extends BaseResourceController<User> {
  constructor(private readonly userService: UserService) {
    super(userService);
  }

  protected getDtoClasses() {
    return {
      query: UserQueryDto,
      update: UpdateUserDto,
    };
  }

  @Post('assign-role')
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.userService.assignRole(assignRoleDto);
  }
}
