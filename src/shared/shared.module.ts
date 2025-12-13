import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@authentication/entities/user.entity';
import jwtConfig from '@shared/config/jwt.config';
import rabbitmqConfig from '@shared/config/rabbitmq.config';
import googleConfig from '@shared/config/google.config';
import { BcryptService } from './hashing/bcrypt.service';
import { HashingService } from './hashing/hashing.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './authentication/guards/authentication.guard';
import { AccessTokenGuard } from './authentication/guards/access-token.guard';
import { RolesGuard } from '@shared/authorization/guards/roles.guard';
import { RestrictMethodsGuard } from '@shared/resource/guards/restrict-methods.guard';
import { Setting } from '@shared/setting/entities/setting.entity';
import { SettingService } from './setting/services/setting.service';
import { RedisService } from './services/redis.service';
import redisConfig from './config/redis.config';
import { RabbitMQService } from '@shared/services/rabbitmq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Setting]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(redisConfig),
    ConfigModule.forFeature(rabbitmqConfig),
    ConfigModule.forFeature(googleConfig),
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RestrictMethodsGuard,
    },
    AccessTokenGuard,
    SettingService,
    RedisService,
    RabbitMQService,
  ],
  exports: [
    JwtModule,
    TypeOrmModule,
    HashingService,
    SettingService,
    RedisService,
    RabbitMQService,
  ],
})
export class SharedModule {}
