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
import { EmailService } from '../services/email.service';
import { EmailSessionGuard } from '../guards/email-session.guard';
import { GmailAccountCtx } from '../decorators/gmail-account.decorator';
import { EmailAccountContext } from '../types/email-account.type';
import { RegisterGmailAccountDto } from '../dto/register-gmail-account.dto';
import { AddGmailLabelDto } from '../dto/add-gmail-label.dto';
import { ReplyMailDto } from '../dto/reply-mail.dto';
import { BaseQueryDto } from '@shared/base-resource/dtos/base-query.dto';

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
      forceConsent === 'true' || forceConsent === '1' || forceConsent === 'yes';
    return {
      url: this.emailService.generateOAuthUrl({ state, forceConsent: force }),
    };
  }

  @UseGuards(EmailSessionGuard)
  @Post('session/refresh')
  refreshSession(@GmailAccountCtx() account: EmailAccountContext) {
    return this.emailService.issueSessionForAccount(account);
  }

  @Post('login')
  login(@Body() dto: RegisterGmailAccountDto) {
    return this.emailService.login(dto);
  }

  @UseGuards(EmailSessionGuard)
  @Get('labels/mapping')
  getLabelMapping() {
    return this.emailService.getLabelMappingSetting();
  }

  @UseGuards(EmailSessionGuard)
  @Post('labels/mapping')
  updateLabelMapping(@Body() mapping: Record<string, string | null>) {
    return this.emailService.updateLabelMappingSetting(mapping as any);
  }

  @UseGuards(EmailSessionGuard)
  @Get('labels')
  getLabels(@GmailAccountCtx() account: EmailAccountContext) {
    return this.emailService.getLabels(account);
  }

  @UseGuards(EmailSessionGuard)
  @Get('labels/:messageId')
  getLabelsForEmail(
    @GmailAccountCtx() account: EmailAccountContext,
    @Param('messageId') messageId: string,
  ) {
    return this.emailService.getLabelsForEmail(account, messageId);
  }

  @UseGuards(EmailSessionGuard)
  @Post('labels/assign')
  addLabel(
    @GmailAccountCtx() account: EmailAccountContext,
    @Body() dto: AddGmailLabelDto,
  ) {
    return this.emailService.addLabelToMail(account, dto);
  }

  @UseGuards(EmailSessionGuard)
  @Get('messages')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  readMessages(@GmailAccountCtx() account: EmailAccountContext) {
    return this.emailService.readAllMails(account);
  }

  @UseGuards(EmailSessionGuard)
  @Get('email')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  getEmails(
    @GmailAccountCtx() account: EmailAccountContext,
    @Query() query: BaseQueryDto,
  ) {
    return this.emailService.getStoredEmails(account, query);
  }

  @UseGuards(EmailSessionGuard)
  @Get('emailAll')
  getAllEmails(@GmailAccountCtx() account: EmailAccountContext) {
    return this.emailService.getAllStoredEmails(account);
  }

  @UseGuards(EmailSessionGuard)
  @Post('messages/reply')
  reply(
    @GmailAccountCtx() account: EmailAccountContext,
    @Body() dto: ReplyMailDto,
  ) {
    return this.emailService.replyMail(account, dto);
  }
}
