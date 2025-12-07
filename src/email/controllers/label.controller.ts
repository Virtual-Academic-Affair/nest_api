import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { Roles } from '@shared/authorization/decorators/roles.decorator';
import { Role } from '@shared/authorization/enums/role.enum';
import { LabelService } from '../services/label.service';
import { LabelDto } from '../dto/label/label.dto';

@ApiTags('Email - Labels')
@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/label')
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @Get('google-labels')
  getLabelsFromGoogle() {
    return this.labelService.getGoogleLabels();
  }

  @Get()
  getLabel() {
    return this.labelService.getLabels();
  }

  @Post()
  updateLabels(@Body() mapping: LabelDto) {
    return this.labelService.updateLabels(mapping);
  }

  @Post('auto-create')
  autoCreateLabels() {
    return this.labelService.autoCreateLabels();
  }
}
