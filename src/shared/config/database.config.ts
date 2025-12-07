import { registerAs } from '@nestjs/config';
import { DatabaseType } from 'typeorm';

export default registerAs('database', () => ({
  type: process.env.DB_TYPE as DatabaseType,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nestjs_auth',
  autoLoadEntities: true,
  synchronize: true,
}));
