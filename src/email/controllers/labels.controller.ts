import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { Roles } from '@shared/authorization/decorators/roles.decorator';
import { Role } from '@shared/authorization/enums/role.enum';
import { LabelsService } from '../services/labels.service';
import { UpdateDto } from '../dto/labels/update.dto';

@ApiTags('Email - Labels')
@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Get('google-labels')
  findAllGoogleLabels() {
    return this.labelsService.findAllGoogleLabels();
  }

  @Get()
  findAll() {
    return this.labelsService.findAll();
  }

  @Post()
  update(@Body() dto: UpdateDto) {
    return this.labelsService.update(dto);
  }

  @Post('auto-create')
  autoCreateLabels() {
    return this.labelsService.autoCreateLabels();
  }
}
