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
import { GmailService } from './email.service';
import { CreateGmailLabelDto } from './dto/create-gmail-label.dto';
import { AddGmailLabelDto } from './dto/add-gmail-label.dto';
import { ReplyMailDto } from './dto/reply-mail.dto';
import { RegisterGmailAccountDto } from './dto/register-gmail-account.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { GmailSessionGuard } from './guards/email-session.guard';
import { GmailAccountCtx } from './decorators/gmail-account.decorator';
import { GmailAccount } from './entities/email-account.entity';
import { Auth } from 'src/iam/authentication/decorators/auth.decorator';
import { AuthType } from 'src/iam/authentication/enums/auth-type.enum';

@ApiTags('Gmail')
@Auth(AuthType.None) 
@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

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
      url: this.gmailService.generateOAuthUrl({ state, forceConsent: force }),
    };
  }

  @UseGuards(GmailSessionGuard)
  @Post('session/refresh')
  refreshSession(@GmailAccountCtx() account: GmailAccount) {
    return this.gmailService.issueSessionForAccount(account);
  }

  @Post('login')
  login(@Body() dto: RegisterGmailAccountDto) {
    return this.gmailService.login(dto);
  }

  @UseGuards(GmailSessionGuard)
  @Get('labels')
  getLabels(@GmailAccountCtx() account: GmailAccount) {
    return this.gmailService.getLabels(account);
  }

  @UseGuards(GmailSessionGuard)
  @Get('labels/:messageId')
  getLabelsForEmail(
    @GmailAccountCtx() account: GmailAccount,
    @Param('messageId') messageId: string,
  ) {
    return this.gmailService.getLabelsForEmail(account, messageId);
  }

  @UseGuards(GmailSessionGuard)
  @Post('labels')
  createLabel(
    @GmailAccountCtx() account: GmailAccount,
    @Body() dto: CreateGmailLabelDto,
  ) {
    return this.gmailService.createLabel(account, dto);
  }

  @UseGuards(GmailSessionGuard)
  @Post('labels/assign')
  addLabel(
    @GmailAccountCtx() account: GmailAccount,
    @Body() dto: AddGmailLabelDto,
  ) {
    return this.gmailService.addLabelToMail(account, dto);
  }

  @UseGuards(GmailSessionGuard)
  @Get('messages')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  readMessages(
    @GmailAccountCtx() account: GmailAccount,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.gmailService.readAllMails(account, query);
  }

  @UseGuards(GmailSessionGuard)
  @Get('email')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  getEmails(
    @GmailAccountCtx() account: GmailAccount,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.gmailService.getStoredEmails(account, query);
  }

  @UseGuards(GmailSessionGuard)
  @Get('emailAll')
  getAllEmails(@GmailAccountCtx() account: GmailAccount) {
    return this.gmailService.getAllStoredEmails(account);
  }

  @UseGuards(GmailSessionGuard)
  @Post('messages/reply')
  reply(
    @GmailAccountCtx() account: GmailAccount,
    @Body() dto: ReplyMailDto,
  ) {
    return this.gmailService.replyMail(account, dto);
  }
}