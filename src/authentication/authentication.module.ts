import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { AuthenticationController } from './controllers/authentication.controller';
import { GoogleAuthenticationService } from './services/google-authentication.service';
import { AuthenticationService } from './services/authentication.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SharedModule } from '@shared/shared.module';
import jwtConfig from '@shared/config/jwt.config';

@Module({
  controllers: [UsersController, AuthenticationController],
  providers: [UsersService, GoogleAuthenticationService, AuthenticationService],
  imports: [
    ConfigModule,
    ConfigModule.forFeature(jwtConfig),
    TypeOrmModule.forFeature([User]),
    SharedModule,
  ],
  exports: [AuthenticationService, TypeOrmModule],
})
export class AuthenticationModule {}
