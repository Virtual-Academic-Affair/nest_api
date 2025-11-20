import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { GmailController } from './email.controller';
import { GmailService } from './email.service';
import { GmailAccount } from './entities/email-account.entity';
import { GmailSessionGuard } from './guards/email-session.guard';
import { GmailLabel } from './entities/email-label.entity';
import { GmailEmail } from './entities/email-email.entity';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([GmailAccount, GmailLabel, GmailEmail, User]),
  ],
  controllers: [GmailController],
  providers: [GmailService, GmailSessionGuard],
  exports: [GmailService],
})
export class GmailModule {}
