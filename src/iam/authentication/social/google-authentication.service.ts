import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthenticationService } from '../authentication.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/users/enums/role.enum';

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

      // Find user by email first (Admin might have created it)
      let user = await this.userRepository.findOne({ where: { email } });

      if (user) {
        if (!user.googleId) {
          user.googleId = googleId;
        }
        if (!user.name && name) {
          user.name = name;
        }
        if (!user.picture && picture) {
          user.picture = picture;
        }
        await this.userRepository.save(user);
        return this.authService.generateTokens(user);
      }

      // User not exists - create new user with role Student (default)
      const newUser = this.userRepository.create({
        email,
        googleId,
        name,
        picture,
        role: Role.Student,
      });
      await this.userRepository.save(newUser);
      return this.authService.generateTokens(newUser);
    } catch (err) {
      const pgUniqueViolationErrorCode = '23505';
      if (err.code === pgUniqueViolationErrorCode) {
        throw new ConflictException();
      }
      throw new UnauthorizedException();
    }
  }
}
