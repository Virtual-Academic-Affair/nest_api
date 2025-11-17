import {
  ConflictException,
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
    try {
      const { tokens } = await this.oAuthClient.getToken(code);

      const loginTicket = await this.oAuthClient.verifyIdToken({
        idToken: tokens.id_token,
      });
      const { email, sub: googleId, name, picture } = loginTicket.getPayload();
      const user = await this.userRepository.findOneBy({ googleId });
      if (user) {
        return this.authService.generateTokens(user);
      } else {
        const newUser = await this.userRepository.save({
          email,
          googleId,
          name,
          picture,
        });
        return this.authService.generateTokens(newUser);
      }
    } catch (err) {
      const pgUniqueViolationErrorCode = '23505';
      if (err.code === pgUniqueViolationErrorCode) {
        throw new ConflictException();
      }
      throw new UnauthorizedException();
    }
  }
}
