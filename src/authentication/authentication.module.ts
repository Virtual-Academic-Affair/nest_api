import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AuthenticationController } from './controllers/authentication.controller';
import { GoogleAuthenticationService } from './services/google-authentication.service';
import { AuthenticationService } from './services/authentication.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SharedModule } from '@shared/shared.module';
import jwtConfig from '@shared/config/jwt.config';

@Module({
  controllers: [UserController, AuthenticationController],
  providers: [UserService, GoogleAuthenticationService, AuthenticationService],
  imports: [
    ConfigModule,
    ConfigModule.forFeature(jwtConfig),
    TypeOrmModule.forFeature([User]),
    SharedModule,
  ],
  exports: [AuthenticationService, TypeOrmModule],
})
export class AuthenticationModule {}
