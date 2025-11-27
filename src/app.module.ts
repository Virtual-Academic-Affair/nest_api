import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthenticationModule } from '@authentication/authentication.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SharedModule } from '@shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { ExampleResourceModule } from './exampleResource/exampleResource.module';
import { GmailModule } from './email/email.module';
import { DatabaseType } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    ExampleResourceModule,
    UsersModule,
    AuthenticationModule,
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as DatabaseType,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    } as TypeOrmModuleOptions),
    IamModule,
    GmailModule,
    SharedModule,
  ],
})
export class AppModule {}
