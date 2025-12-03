import { Body, Controller, Get, Post } from '@nestjs/common';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { GoogleAuthenticationService } from '../services/google-authentication.service';
import { GoogleCodeDto } from '@authentication/dtos/authentication/google-code.dto';
import { RefreshTokenDto } from '@authentication/dtos/authentication/refresh-token.dto';
import { ActiveUser } from '@shared/authentication/decorators/active-user.decorator';
import { ActiveUserData } from '@shared/authentication/interfaces/active-user-data.interface';
import { UserService } from '../services/user.service';
import { AuthenticationService } from '../services/authentication.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly googleAuthService: GoogleAuthenticationService,
    private readonly userService: UserService,
    private readonly authService: AuthenticationService,
  ) {}

  @Post('google')
  authenticate(@Body() codeDto: GoogleCodeDto) {
    return this.googleAuthService.authenticate(codeDto.code);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Get('me')
  @Auth(AuthType.Bearer)
  async getMe(@ActiveUser('sub') sub: ActiveUserData['sub']) {
    return this.userService.findOne(sub);
  }
}
