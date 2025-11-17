import { Body, Controller, Post } from '@nestjs/common';
import { Auth } from '../../shared/authentication/decorators/auth.decorator';
import { AuthType } from '../../shared/authentication/enums/auth-type.enum';
import { GoogleAuthenticationService } from '../services/google-authentication.service';
import { GoogleCodeDto } from '../dto/google-code.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Auth(AuthType.None)
@Controller('authentication/google')
export class GoogleAuthenticationController {
  constructor(
    private readonly googleAuthService: GoogleAuthenticationService,
  ) {}

  @Post()
  authenticate(@Body() codeDto: GoogleCodeDto) {
    return this.googleAuthService.authenticate(codeDto.code);
  }
}
