import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/iam/authentication/decorators/auth.decorator';
import { AuthType } from 'src/iam/authentication/enums/auth-type.enum';
import { Roles } from 'src/iam/authorization/decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { AssignRoleDto } from './dto/assign-role.dto';

 
//Admin controller
@ApiTags('Users')
@ApiBearerAuth('jwt')
@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //Admin assigns role to user
  @Post('assign-role')
  async assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return await this.usersService.assignRole(assignRoleDto);
  }

  //Get all users
  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }
}
