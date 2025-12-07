import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { Roles } from '@shared/authorization/decorators/roles.decorator';
import { Role } from '@shared/authorization/enums/role.enum';
import { CreateGrantDto } from '../dto/grant/create-grant.dto';
import { GrantsService } from '../services/grants.service';

@ApiTags('Email - Grant')
@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/grants')
export class GrantsController {
  constructor(private readonly grantsService: GrantsService) {}

  @Get()
  generateAuthUrl() {
    return this.grantsService.generateAuthUrl();
  }

  @Post()
  grant(@Body() dto: CreateGrantDto) {
    return this.grantsService.grant(dto.code);
  }
}
