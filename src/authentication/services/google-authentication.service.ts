import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthenticationService } from './authentication.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@authentication/entities/user.entity';
import { Role } from '@shared/authorization/enums/role.enum';

@Injectable()
export class GoogleAuthenticationService implements OnModuleInit {
  private oAuthClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthenticationService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  onModuleInit() {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');
    this.oAuthClient = new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  async authenticate(code: string) {
    const { tokens } = await this.oAuthClient.getToken(code);

    const loginTicket = await this.oAuthClient.verifyIdToken({
      idToken: tokens.id_token,
    });
    const payload = loginTicket.getPayload();

    const user = await this.userRepository.findOneBy({
      email: payload.email,
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.role !== Role.Admin) {
      throw new UnauthorizedException('Only admin users are allowed');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    Object.assign(user, {
      googleId: payload.sub,
      name: payload.name,
      picture: payload.picture,
    });

    await this.userRepository.save(user);
    return this.authService.generateTokens(user);
  }
}
