import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { RefreshTokenDto } from '@authentication/dtos/auth/refresh-token.dto';
import { ActiveUser } from '@shared/authentication/decorators/active-user.decorator';
import { ActiveUserData } from '@shared/authentication/interfaces/active-user-data.interface';
import { UserService } from '../services/user.service';
import { AuthService } from '@authentication/services/auth.service';

@ApiTags('Authentication')
@Controller('authentication/auth')
export class AuthenticationController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Get('me')
  @Auth(AuthType.Bearer)
  async getMe(@ActiveUser('sub') sub: ActiveUserData['sub']) {
    return this.userService.findOne(sub);
  }
}
