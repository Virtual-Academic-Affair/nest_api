import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SharedModule } from '@shared/shared.module';
import { Email } from './entities/email.entity';
import { User } from '@authentication/entities/user.entity';
import { GoogleapisService } from './services/googleapis.service';
import { LabelService } from './services/label.service';
import { GrantService } from './services/grant.service';
import { GrantController } from './controllers/grant.controller';
import { LabelController } from './controllers/label.controller';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    SharedModule,
    TypeOrmModule.forFeature([Email, User]),
  ],
  controllers: [GrantController, LabelController],
  providers: [GoogleapisService, LabelService, GrantService],
  exports: [GoogleapisService, LabelService, GrantService],
})
export class EmailModule {}
