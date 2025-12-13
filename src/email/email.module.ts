import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SharedModule } from '@shared/shared.module';
import { Email } from './entities/email.entity';
import { User } from '@authentication/entities/user.entity';
import { GoogleapisService } from './services/googleapis.service';
import { LabelsService } from './services/labels.service';
import { GrantsService } from './services/grants.service';
import { EmailSyncService } from './services/email-sync.service';
import { EmailSyncScheduler } from './scheduler/email-sync.scheduler';
import { NlpLabeledService } from './services/nlp-labeled.service';
import { GrantsController } from './controllers/grants.controller';
import { LabelsController } from './controllers/labels.controller';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    SharedModule,
    TypeOrmModule.forFeature([Email, User]),
  ],
  controllers: [GrantsController, LabelsController],
  providers: [
    GoogleapisService,
    LabelsService,
    GrantsService,
    EmailSyncService,
    NlpLabeledService,
    EmailSyncScheduler,
  ],
  exports: [
    GoogleapisService,
    LabelsService,
    GrantsService,
    EmailSyncService,
    NlpLabeledService,
  ],
})
export class EmailModule {}
