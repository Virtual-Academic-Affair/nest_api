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
import { GmailService } from './gmail.service';
import { CreateGmailTagDto } from './dto/create-gmail-tag.dto';
import { AddGmailTagDto } from './dto/add-gmail-tag.dto';
import { ReplyMailDto } from './dto/reply-mail.dto';
import { RegisterGmailAccountDto } from './dto/register-gmail-account.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { GmailSessionGuard } from './guards/gmail-session.guard';
import { GmailAccountCtx } from './decorators/gmail-account.decorator';
import { GmailAccount } from './entities/gmail-account.entity';
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
  @Get('tags')
  getTags(@GmailAccountCtx() account: GmailAccount) {
    return this.gmailService.getTags(account);
  }

  @UseGuards(GmailSessionGuard)
  @Get('tags/:messageId')
  getTagsForEmail(
    @GmailAccountCtx() account: GmailAccount,
    @Param('messageId') messageId: string,
  ) {
    return this.gmailService.getTagsForEmail(account, messageId);
  }

  @UseGuards(GmailSessionGuard)
  @Post('tags')
  createTag(
    @GmailAccountCtx() account: GmailAccount,
    @Body() dto: CreateGmailTagDto,
  ) {
    return this.gmailService.createTag(account, dto);
  }

  @UseGuards(GmailSessionGuard)
  @Post('tags/assign')
  addTag(
    @GmailAccountCtx() account: GmailAccount,
    @Body() dto: AddGmailTagDto,
  ) {
    return this.gmailService.addTagToMail(account, dto);
  }

  @UseGuards(GmailSessionGuard)
  @Get('messages')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  readMessages(
    @GmailAccountCtx() account: GmailAccount,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.gmailService.readAllMails(account, query);
  }

  @UseGuards(GmailSessionGuard)
  @Get('email')
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
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
