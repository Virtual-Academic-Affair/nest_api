import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './services/email.service';
import { GmailAccount } from './entities/email-account.entity';
import { EmailSessionGuard } from './guards/email-session.guard';
import { GmailLabel } from './entities/email-label.entity';
import { GmailEmail } from './entities/email-email.entity';
import { User } from '@authentication/entities/user.entity';
import { EmailController } from './controllers/email.controller';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([GmailAccount, GmailLabel, GmailEmail, User]),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailSessionGuard],
  exports: [EmailService],
})
export class EmailModule {}