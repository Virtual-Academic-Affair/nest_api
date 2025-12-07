import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { Roles } from '@shared/authorization/decorators/roles.decorator';
import { Role } from '@shared/authorization/enums/role.enum';
import { GrantDto } from '../dto/grant/grant.dto';
import { GrantService } from '../services/grant.service';

@ApiTags('Email - Grant')
@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/grant')
export class GrantController {
  constructor(private readonly grantService: GrantService) {}

  @Get()
  getOAuthUrl() {
    return this.grantService.generateAuthUrl();
  }

  @Post()
  register(@Body() dto: GrantDto) {
    return this.grantService.grant(dto.code);
  }
}
