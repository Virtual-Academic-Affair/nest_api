import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthenticationModule } from '@authentication/authentication.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SharedModule } from '@shared/shared.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import databaseConfig from '@shared/config/database.config';
import { ApiResponseModule } from '@zabih-dev/nest-api-response';

@Module({
  imports: [
    ApiResponseModule,
    ConfigModule.forRoot({
      load: [databaseConfig],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.get('database') as TypeOrmModuleOptions;
      },
    }),
    EmailModule,
    SharedModule,
    AuthenticationModule,
  ],
})
export class AppModule {}
