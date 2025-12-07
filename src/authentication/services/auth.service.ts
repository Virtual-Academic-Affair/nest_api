import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import jwtConfig from '@shared/config/jwt.config';
import { ActiveUserData } from '@shared/authentication/interfaces/active-user-data.interface';
import { RedisService } from '@shared/services/redis.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly redisService: RedisService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private getRefreshTokenRedisKey(refreshTokenId: string | number): string {
    return `refresh_token:${refreshTokenId}`;
  }

  async generateTokens(user: User) {
    if (!user.isActive) {
      throw new UnauthorizedException('User inactive');
    }

    const accessToken = await this.signToken<Partial<ActiveUserData>>(
      user.id,
      this.jwtConfiguration.accessTokenTtl,
      { email: user.email, role: user.role },
    );

    const refreshTokenId = randomUUID();
    const refreshToken = await this.signToken(
      user.id,
      this.jwtConfiguration.refreshTokenTtl,
      { refreshTokenId },
    );

    await this.redisService.set(
      this.getRefreshTokenRedisKey(refreshTokenId),
      user.id.toString(),
      this.jwtConfiguration.refreshTokenTtl,
    );
    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    const payload = await this.jwtService
      .verifyAsync<{
        sub: number;
        refreshTokenId: string;
      }>(refreshToken, this.jwtConfiguration)
      .catch(() => {
        throw new UnauthorizedException('Invalid refresh token');
      });

    if (!payload.refreshTokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = await this.redisService.get(
      this.getRefreshTokenRedisKey(payload.refreshTokenId),
    );

    if (!userId) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    const user = await this.userRepository.findOneBy({
      id: parseInt(userId, 10),
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.redisService.del(
      this.getRefreshTokenRedisKey(payload.refreshTokenId),
    );
    return this.generateTokens(user);
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
