import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AuthenticationController } from './controllers/auth.controller';
import { GoogleController } from './controllers/google.controller';
import { GoogleService } from './services/google.service';
import { AuthService } from './services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SharedModule } from '@shared/shared.module';
import jwtConfig from '@shared/config/jwt.config';

@Module({
  controllers: [UserController, AuthenticationController, GoogleController],
  providers: [UserService, GoogleService, AuthService],
  imports: [
    ConfigModule,
    ConfigModule.forFeature(jwtConfig),
    TypeOrmModule.forFeature([User]),
    SharedModule,
  ],
  exports: [AuthService, TypeOrmModule],
})
export class AuthenticationModule {}
