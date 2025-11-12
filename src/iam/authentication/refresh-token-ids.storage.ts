import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import Redis from 'ioredis';
import { InvalidatedRefreshTokenError } from './errors/InvalidateRefreshTokenError';

@Injectable()
export class RefreshTokenIdsStorage
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private redisClient: Redis;
  private static readonly HASH_KEY = 'refresh_token';

  onApplicationBootstrap() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    });
  }

  onApplicationShutdown(signal?: string) {
    return this.redisClient.quit();
  }

  async insert(userId: number, tokenId: string): Promise<void> {
    await this.redisClient.hset(
      RefreshTokenIdsStorage.HASH_KEY,
      this.getField(userId),
      tokenId,
    );
  }

  async validate(userId: number, tokenId: string): Promise<boolean> {
    const storedId = await this.redisClient.hget(
      RefreshTokenIdsStorage.HASH_KEY,
      this.getField(userId),
    );
    if (storedId !== tokenId) {
      throw new InvalidatedRefreshTokenError();
    }
    return true;
  }

  async invalidate(userId: number): Promise<void> {
    await this.redisClient.hdel(
      RefreshTokenIdsStorage.HASH_KEY,
      this.getField(userId),
    );
  }

  private getField(userId: number): string {
    return String(userId);
  }
}
