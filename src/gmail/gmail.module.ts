import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';
import { GmailAccount } from './entities/gmail-account.entity';
import { GmailSessionGuard } from './guards/gmail-session.guard';
import { GmailTag } from './entities/gmail-tag.entity';
import { GmailEmail } from './entities/gmail-email.entity';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([GmailAccount, GmailTag, GmailEmail, User]),
  ],
  controllers: [GmailController],
  providers: [GmailService, GmailSessionGuard],
  exports: [GmailService],
})
export class GmailModule {}
