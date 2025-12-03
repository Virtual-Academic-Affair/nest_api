import { registerAs } from '@nestjs/config';

export interface RedisConfiguration {
  host: string;
  port: number;
  password?: string;
  retryStrategy?: (times: number) => number;
}

export default registerAs<RedisConfiguration>('redis', () => {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      return Math.min(times * 50, 2000);
    },
  };
});
