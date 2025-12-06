import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './services/email.service';
import { EmailSessionGuard } from './guards/email-session.guard';
import { GmailEmail } from './entities/email-email.entity';
import { User } from '@authentication/entities/user.entity';
import { EmailController } from './controllers/email.controller';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    SharedModule,
    TypeOrmModule.forFeature([GmailEmail, User]),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailSessionGuard],
  exports: [EmailService],
})
export class EmailModule {}
