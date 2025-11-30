import { Body, Controller, Get, Post } from '@nestjs/common';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { GoogleAuthenticationService } from '../services/google-authentication.service';
import { GoogleCodeDto } from '../dto/google-code.dto';
import { ActiveUser } from '@shared/decorators/active-user.decorator';
import { ActiveUserData } from '@shared/interfaces/active-user-data.interface';
import { UserService } from '../services/user.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly googleAuthService: GoogleAuthenticationService,
    private readonly userService: UserService,
  ) {}

  @Post('google')
  @Auth(AuthType.None)
  authenticate(@Body() codeDto: GoogleCodeDto) {
    return this.googleAuthService.authenticate(codeDto.code);
  }

  @Get('me')
  @Auth(AuthType.Bearer)
  async getMe(@ActiveUser() user: ActiveUserData) {
    return this.userService.findOne(user.sub);
  }
}
