import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import jwtConfig from '@shared/config/jwt.config';
import { ActiveUserData } from '@shared/interfaces/active-user-data.interface';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async generateTokens(user: User) {
    const accessToken = await this.signToken<Partial<ActiveUserData>>(
      user.id,
      this.jwtConfiguration.accessTokenTtl,
      { email: user.email, role: user.role },
    );
    return {
      accessToken,
    };
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }
}
