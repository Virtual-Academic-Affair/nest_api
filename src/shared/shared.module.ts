import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@authentication/entities/user.entity';
import jwtConfig from '@shared/config/jwt.config';
import { BcryptService } from './hashing/bcrypt.service';
import { HashingService } from './hashing/hashing.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './authentication/guards/authentication.guard';
import { AccessTokenGuard } from './authentication/guards/access-token.guard';
import { RolesGuard } from './authorization/guard/roles.guard';
import { RestrictMethodsGuard } from './guards/restrict-methods.guard';
import { Setting } from './entities/setting.entity';
import { SettingService } from './services/setting.service';
import { RedisService } from './services/redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Setting]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
  ],
  providers: [
    { provide: HashingService, useClass: BcryptService },
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
  ],
  exports: [
    JwtModule,
    TypeOrmModule,
    HashingService,
    SettingService,
    RedisService,
  ],
})
export class SharedModule {}
