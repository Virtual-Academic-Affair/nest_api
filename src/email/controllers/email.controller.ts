import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { Auth } from '@shared/authentication/decorators/auth.decorator';
import { AuthType } from '@shared/authentication/enums/auth-type.enum';
import { BaseQueryDto } from '@shared/dto/base-query.dto';
import { EmailService } from '../services/email.service';
import { EmailSessionGuard } from '../guards/email-session.guard';
import { GmailAccountCtx } from '../decorators/gmail-account.decorator';
import { GmailAccount } from '../entities/email-account.entity';
import { RegisterGmailAccountDto } from '../dto/register-gmail-account.dto';
import { CreateGmailLabelDto } from '../dto/create-gmail-label.dto';
import { AddGmailLabelDto } from '../dto/add-gmail-label.dto';
import { ReplyMailDto } from '../dto/reply-mail.dto';

@ApiTags('Email')
@Auth(AuthType.None)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('oauth-url')
  getOAuthUrl(
    @Query('state') state?: string,
    @Query('forceConsent') forceConsent?: string,
  ) {
    const force =
      forceConsent === 'true' ||
      forceConsent === '1' ||
      forceConsent === 'yes';
    return {
      url: this.emailService.generateOAuthUrl({ state, forceConsent: force }),
    };
  }

  @UseGuards(EmailSessionGuard)
  @Post('session/refresh')
  refreshSession(@GmailAccountCtx() account: GmailAccount) {
    return this.emailService.issueSessionForAccount(account);
  }

  @Post('login')
  login(@Body() dto: RegisterGmailAccountDto) {
    return this.emailService.login(dto);
  }

  @UseGuards(EmailSessionGuard)
  @Get('labels')
  getLabels(@GmailAccountCtx() account: GmailAccount) {
    return this.emailService.getLabels(account);
  }

  @UseGuards(EmailSessionGuard)
  @Get('labels/:messageId')
  getLabelsForEmail(
    @GmailAccountCtx() account: GmailAccount,
    @Param('messageId') messageId: string,
  ) {
    return this.emailService.getLabelsForEmail(account, messageId);
  }

  @UseGuards(EmailSessionGuard)
  @Post('labels')
  createLabel(
    @GmailAccountCtx() account: GmailAccount,
    @Body() dto: CreateGmailLabelDto,
  ) {
    return this.emailService.createLabel(account, dto);
  }

  @UseGuards(EmailSessionGuard)
  @Post('labels/assign')
  addLabel(
    @GmailAccountCtx() account: GmailAccount,
    @Body() dto: AddGmailLabelDto,
  ) {
    return this.emailService.addLabelToMail(account, dto);
  }

  @UseGuards(EmailSessionGuard)
  @Get('messages')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  readMessages(
    @GmailAccountCtx() account: GmailAccount,
  ) {
    return this.emailService.readAllMails(account);
  }

  @UseGuards(EmailSessionGuard)
  @Get('email')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  getEmails(
    @GmailAccountCtx() account: GmailAccount,
    @Query() query: BaseQueryDto,
  ) {
    return this.emailService.getStoredEmails(account, query);
  }

  @UseGuards(EmailSessionGuard)
  @Get('emailAll')
  getAllEmails(@GmailAccountCtx() account: GmailAccount) {
    return this.emailService.getAllStoredEmails(account);
  }

  @UseGuards(EmailSessionGuard)
  @Post('messages/reply')
  reply(
    @GmailAccountCtx() account: GmailAccount,
    @Body() dto: ReplyMailDto,
  ) {
    return this.emailService.replyMail(account, dto);
  }
}