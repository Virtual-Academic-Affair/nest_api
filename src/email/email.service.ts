import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { GenerateAuthUrlOpts } from 'google-auth-library';
import { google, gmail_v1 } from 'googleapis';
import { In, Repository } from 'typeorm';

import { AddGmailLabelDto } from './dto/add-gmail-label.dto';
import { CreateGmailLabelDto } from './dto/create-gmail-label.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { RegisterGmailAccountDto } from './dto/register-gmail-account.dto';
import { ReplyMailDto } from './dto/reply-mail.dto';
import { GmailAccount } from './entities/email-account.entity';
import { GmailLabel } from './entities/email-label.entity';
import { GmailEmail } from './entities/email-email.entity';
import { User } from '@authentication/entities/user.entity';
import { Role } from '@shared/authorization/enums/role.enum';

const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sessionSecret: string;
  private readonly sessionTtl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(GmailAccount)
    private readonly gmailAccountRepo: Repository<GmailAccount>,
    @InjectRepository(GmailLabel)
    private readonly gmailLabelRepo: Repository<GmailLabel>,
    @InjectRepository(GmailEmail)
    private readonly gmailEmailRepo: Repository<GmailEmail>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {
    this.sessionSecret =
      this.configService.get<string>('GMAIL_SESSION_SECRET') ?? '';
    if (!this.sessionSecret) {
      throw new ServiceUnavailableException(
        'Thiếu EMAIL_SESSION_SECRET configuration.',
      );
    }
    this.sessionTtl =
      this.configService.get<string>('GMAIL_SESSION_TTL') ?? '2h';
  }

  generateOAuthUrl(options?: { state?: string; forceConsent?: boolean }) {
    const { state, forceConsent } = options ?? {};
    const client = this.createOAuthClient();
    const params: GenerateAuthUrlOpts = {
      access_type: 'offline',
      scope: GMAIL_SCOPES,
      include_granted_scopes: true,
    };
    if (state) {
      params.state = state;
    }
    if (forceConsent) {
      params.prompt = 'consent';
    }
    return client.generateAuthUrl(params);
  }

  async login(dto: RegisterGmailAccountDto) {
    const oauthClient = this.createOAuthClient();
    const { tokens } = await oauthClient.getToken(dto.code);
    let refreshToken = tokens.refresh_token;

    oauthClient.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauthClient });
    const { data: profile } = await gmail.users.getProfile({ userId: 'me' });

    if (!profile.emailAddress) {
      throw new ServiceUnavailableException(
        'Unable to retrieve email from Email profile.',
      );
    }

    const user = await this.usersRepository.findOne({
      where: { email: profile.emailAddress },
    });

    if (
      !user ||
      ![Role.Admin].includes(user.role as Role)
    ) {
      throw new ForbiddenException(
        'This email does not have permission to use the Gmail module.',
      );
    }

    let account = await this.gmailAccountRepo.findOne({
      where: { userId: user.id },
    });

    if (!refreshToken) {
      refreshToken = account?.refreshToken;
    }

    if (!refreshToken) {
      throw new ServiceUnavailableException(
        'Google did not return a refresh token. Please select "Request consent again" and try again.',
      );
    }

    if (account) {
      account.refreshToken = refreshToken;
      account.email = profile.emailAddress;
      account.displayName = profile.emailAddress;
    } else {
      account = this.gmailAccountRepo.create({
        email: profile.emailAddress,
        refreshToken,
        displayName: profile.emailAddress,
        user,
        userId: user.id,
      });
    }

    await this.gmailAccountRepo.save(account);

    const sessionToken = await this.issueSessionToken(account);

    return {
      token: sessionToken,
      expiresIn: this.sessionTtl,
      account: {
        id: account.id,
        email: account.email,
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
        },
      },
    };
  }

  async issueSessionForAccount(account: GmailAccount) {
    const token = await this.issueSessionToken(account);
    const user = account.user ?? (await this.usersRepository.findOneBy({ id: account.userId }));
    return {
      token,
      expiresIn: this.sessionTtl,
      account: {
        id: account.id,
        email: account.email,
        user: user
          ? { id: user.id, role: user.role, email: user.email }
          : undefined,
      },
    };
  }

  private async issueSessionToken(account: GmailAccount) {
    return this.jwtService.signAsync(
      {
        accountId: account.id,
        userId: account.userId,
        email: account.email,
      },
      {
        secret: this.sessionSecret,
        expiresIn: this.sessionTtl,
      },
    );
  }

  async validateSession(token: string) {
    const payload = await this.jwtService.verifyAsync<{
      accountId: string;
    }>(token, {
      secret: this.sessionSecret,
    });
    const account = await this.gmailAccountRepo.findOne({
      where: { id: payload.accountId },
    });
    if (!account) {
      throw new NotFoundException('Email account not found.');
    }
    return account;
  }

  async getLabels(account: GmailAccount) {
    const client = await this.getClient(account);
    const { data } = await client.users.labels.list({ userId: 'me' });
    const labels = data.labels ?? [];
    await this.upsertLabels(account, labels);
    return labels;
  }

  async getLabelsForEmail(account: GmailAccount, messageId: string) {
    const email = await this.gmailEmailRepo.findOne({
      where: {
        gmailAccount: { id: account.id },
        gmailMessageId: messageId,
      },
      relations: ['labels'],
    });

    if (!email) {
      throw new NotFoundException('Email not found with this messageId.');
    }

    return email.labels ?? [];
  }

  async createLabel(account: GmailAccount, dto: CreateGmailLabelDto) {
    const client = await this.getClient(account);
    const { data } = await client.users.labels.create({
      userId: 'me',
      requestBody: {
        name: dto.name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    });
    if (data) {
      await this.upsertLabels(account, [data]);
    }
    return data;
  }

  async addLabelToMail(account: GmailAccount, dto: AddGmailLabelDto) {
    const client = await this.getClient(account);
    const { data } = await client.users.messages.modify({
      userId: 'me',
      id: dto.messageId,
      requestBody: {
        addLabelIds: [dto.labelId],
      },
    });

    const label = await this.ensureLabel(account, dto.labelId);
    if (label) {
      const email = await this.gmailEmailRepo.findOne({
        where: { gmailMessageId: dto.messageId },
        relations: ['labels'],
      });
      if (email) {
        const labelExists = email.labels?.some(
          (existing) => existing.id === label.id,
        );
        if (!labelExists) {
          email.labels = [...(email.labels ?? []), label];
          await this.gmailEmailRepo.save(email);
        }
      }
    }

    return data;
  }

  async readAllMails(account: GmailAccount, query: ListMessagesQueryDto) {
    return this.pullEmailsFromGmail(account);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoPullEmails() {
    const accounts = await this.gmailAccountRepo.find();
    for (const account of accounts) {
      try {
        await this.pullEmailsFromGmail(account);
      } catch (error) {
        const reason = error instanceof Error ? error.stack ?? error.message : String(error);
        this.logger.error(
          `Failed to pull Gmail messages for account ${account.id}`,
          reason,
        );
      }
    }
  }

  async getStoredEmails(account: GmailAccount, query: ListMessagesQueryDto) {
    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const skip = (page - 1) * limit;
    return this.gmailEmailRepo.find({
      where: { gmailAccount: { id: account.id } },
      relations: ['labels'],
      order: { internalDate: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip,
    });
  }

  async getAllStoredEmails(account: GmailAccount) {
    return this.gmailEmailRepo.find({
      where: { gmailAccount: { id: account.id } },
      relations: ['labels'],
      order: { internalDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async replyMail(account: GmailAccount, dto: ReplyMailDto) {
    const client = await this.getClient(account);

    const encodedSubject = Buffer.from(dto.subject ?? "", "utf-8").toString("base64");

    const rawLines = [
      `To: ${dto.to}`,
      `Subject: =?UTF-8?B?${encodedSubject}?=`,
      `In-Reply-To: ${dto.messageId}`,
      `References: ${dto.messageId}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      "",
      Buffer.from(dto.body ?? "", "utf-8").toString("base64"),
    ];

    const rawMessage = rawLines.join("\r\n");

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const { data } = await client.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        threadId: dto.threadId,
      },
    });

    return data;
  }


  private createOAuthClient() {
    const clientId = this.configService.get<string>('GMAIL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GMAIL_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GMAIL_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new ServiceUnavailableException(
        'Missing GMAIL_CLIENT_ID/SECRET/REDIRECT_URI configuration.',
      );
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  private async getClient(account: GmailAccount) {
    const oauthClient = this.createOAuthClient();
    oauthClient.setCredentials({ refresh_token: account.refreshToken });
    return google.gmail({ version: 'v1', auth: oauthClient });
  }

  private async ensureLabel(account: GmailAccount, labelId: string) {
    if (!labelId) {
      return null;
    }
    let label = await this.gmailLabelRepo.findOne({
      where: {
        gmailAccount: { id: account.id },
        gmailLabelId: labelId,
      },
    });
    if (label) {
      return label;
    }
    const client = await this.getClient(account);
    const { data } = await client.users.labels.get({
      userId: 'me',
      id: labelId,
    });
    const map = await this.upsertLabels(account, data ? [data] : []);
    return map.get(labelId) ?? null;
  }

  private async upsertLabels(
    account: GmailAccount,
    labels: gmail_v1.Schema$Label[] = [],
  ) {
    const existing = await this.gmailLabelRepo.find({
      where: { gmailAccount: { id: account.id } },
    });
    const existingMap = new Map(
      existing.map((label) => [label.gmailLabelId, label]),
    );
    const toSave: GmailLabel[] = [];

    for (const label of labels) {
      if (!label?.id) continue;
      const entity =
        existingMap.get(label.id) ??
        this.gmailLabelRepo.create({
          gmailAccount: account,
          gmailLabelId: label.id,
        });
      entity.name = label.name ?? entity.name ?? label.id;
      entity.type = label.type ?? entity.type;
      entity.color = label.color?.backgroundColor ?? entity.color;
      existingMap.set(label.id, entity);
      toSave.push(entity);
    }

    if (toSave.length) {
      await this.gmailLabelRepo.save(toSave);
    }

    return existingMap;
  }

  private async persistEmails(
    account: GmailAccount,
    messages: Array<{
      id?: string | null;
      threadId?: string | null;
      snippet?: string | null;
      headers: Record<string, string>;
      payload?: gmail_v1.Schema$MessagePart | null;
      labelIds?: string[] | null;
      internalDate?: string | null;
      senderName?: string;
      senderEmail?: string;
      receiverName?: string;
      receiverEmail?: string;
      content?: string;
      parentEmailId?: string;
      messageIdHeader?: string;
    }>,
    labelMap: Map<string, GmailLabel>,
  ) {
    const ids = messages
      .map((message) => message.id)
      .filter((id): id is string => !!id);
    if (!ids.length) {
      return;
    }

    const existing = await this.gmailEmailRepo.find({
      where: { gmailMessageId: In(ids) },
      relations: ['labels'],
    });
    const existingMap = new Map(
      existing.map((email) => [email.gmailMessageId, email]),
    );

    const toSave: GmailEmail[] = [];

    for (const message of messages) {
      if (!message.id) continue;
      const entity =
        existingMap.get(message.id) ??
        this.gmailEmailRepo.create({
          gmailAccount: account,
          gmailMessageId: message.id,
        });

      entity.threadId = message.threadId ?? entity.threadId;
      entity.content =
        message.content ?? message.snippet ?? entity.content ?? undefined;
      entity.subject = message.headers['Subject'] ?? entity.subject;
      entity.senderName = message.senderName ?? entity.senderName;
      entity.senderEmail = message.senderEmail ?? entity.senderEmail;
      entity.receiverName = message.receiverName ?? entity.receiverName;
      entity.receiverEmail = message.receiverEmail ?? entity.receiverEmail;
      entity.parentEmailId = message.parentEmailId ?? entity.parentEmailId;
      entity.messageIdHeader =
        message.messageIdHeader ?? entity.messageIdHeader;
      entity.internalDate = message.internalDate
        ? new Date(Number(message.internalDate))
        : entity.internalDate ?? new Date();
      entity.fetchedAt = new Date();
      entity.labels =
        message.labelIds
          ?.map((labelId) => labelMap.get(labelId))
          .filter((label): label is GmailLabel => !!label) ?? [];

      toSave.push(entity);
    }

    if (toSave.length) {
      await this.gmailEmailRepo.save(toSave);
    }
  }

  private extractHeaders(
    headers: gmail_v1.Schema$MessagePartHeader[] = [],
  ): Record<string, string> {
    return headers.reduce<Record<string, string>>((acc, header) => {
      if (header.name && header.value) {
        acc[header.name] = header.value;
      }
      return acc;
    }, {});
  }

  private parseEmailAddress(
    raw?: string,
  ): { name?: string; email?: string } {
    if (!raw) {
      return {};
    }
    const parts = raw.split(',');
    const first = parts[0].trim();
    const match = first.match(/^(?:"?([^"]*)"?\s)?<?([^<>@\s]+@[^<>@\s]+)>?$/);
    if (match) {
      const name = match[1]?.trim() || undefined;
      const email = match[2]?.trim();
      return { name, email };
    }
    return { email: first };
  }

  private extractPlainText(
    payload?: gmail_v1.Schema$MessagePart | null,
  ): string | undefined {
    if (!payload) {
      return undefined;
    }

    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      return this.decodeBody(payload.body.data);
    }

    if (payload.parts?.length) {
      for (const part of payload.parts) {
        const text = this.extractPlainText(part);
        if (text) {
          return text;
        }
      }
    }

    if (payload.mimeType === 'text/html' && payload.body?.data) {
      return this.decodeBody(payload.body.data);
    }

    if (payload.body?.data) {
      return this.decodeBody(payload.body.data);
    }

    return undefined;
  }

  private decodeBody(data?: string) {
    if (!data) return undefined;
    const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(normalized, 'base64').toString('utf-8');
  }

  private async pullEmailsFromGmail(
    account: GmailAccount,
    triggeredAt = new Date(),
  ) {
    const client = await this.getClient(account);
    const defaultSince = new Date(triggeredAt);
    defaultSince.setDate(defaultSince.getDate() - 2);
    const sinceDate = account.lastPulledAt ?? defaultSince;
    const queryString = this.buildQuerySince(sinceDate);
    const collectedMessages: gmail_v1.Schema$Message[] = [];
    let pageToken: string | undefined;

    do {
      const { data } = await client.users.messages.list({
        userId: 'me',
        maxResults: 100,
        q: queryString,
        pageToken,
      });

      if (data.messages?.length) {
        collectedMessages.push(...data.messages);
      }

      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken);

    if (!collectedMessages.length) {
      await this.updateLastPulledAt(account, triggeredAt);
      return [];
    }

    const newMessageIds = collectedMessages
      .map((message) => message.id)
      .filter((id): id is string => !!id);

    if (!newMessageIds.length) {
      await this.updateLastPulledAt(account, triggeredAt);
      return [];
    }

    const alreadyFetched = await this.gmailEmailRepo.find({
      select: ['gmailMessageId'],
      where: {
        gmailAccount: { id: account.id },
        gmailMessageId: In(newMessageIds),
      },
    });

    const alreadyFetchedIds = new Set(
      alreadyFetched.map((email) => email.gmailMessageId),
    );

    const filteredMessages = collectedMessages.filter(
      (message) => !!message.id && !alreadyFetchedIds.has(message.id),
    );

    if (!filteredMessages.length) {
      await this.updateLastPulledAt(account, triggeredAt);
      return [];
    }

    const { data: labelsData } = await client.users.labels.list({
      userId: 'me',
    });
    const labelMap = await this.upsertLabels(account, labelsData.labels ?? []);

    const details = await Promise.all(
      filteredMessages.map(async (message) => {
        const { data: messageData } = await client.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });

        const internalDate = messageData.internalDate
          ? new Date(Number(messageData.internalDate))
          : undefined;

        if (internalDate && internalDate < sinceDate) {
          return null;
        }

        const headers = this.extractHeaders(messageData.payload?.headers);
        const senderInfo = this.parseEmailAddress(headers['From']);
        const receiverInfo = this.parseEmailAddress(headers['To']);
        const content = this.extractPlainText(messageData.payload);
        const parentEmailId =
          headers['In-Reply-To'] ?? headers['References'] ?? undefined;
        const messageIdHeader =
          headers['Message-ID'] ??
          headers['Message-Id'] ??
          headers['message-id'];

        return {
          id: messageData.id,
          threadId: messageData.threadId,
          snippet: messageData.snippet,
          headers,
          payload: messageData.payload,
          labelIds: messageData.labelIds,
          internalDate: messageData.internalDate,
          senderName: senderInfo.name,
          senderEmail: senderInfo.email,
          receiverName: receiverInfo.name,
          receiverEmail: receiverInfo.email,
          content,
          parentEmailId,
          messageIdHeader,
        };
      }),
    );

    const cleanDetails = details.filter(
      (detail): detail is NonNullable<typeof detail> => !!detail,
    );

    await this.persistEmails(account, cleanDetails, labelMap);
    await this.updateLastPulledAt(account, triggeredAt);

    return cleanDetails;
  }

  private buildQuerySince(date: Date) {
    const timestamp = Math.floor(date.getTime() / 1000);
    return `-from:me after:${timestamp}`;
  }

  private async updateLastPulledAt(
    account: GmailAccount,
    pulledAt: Date,
  ): Promise<void> {
    account.lastPulledAt = pulledAt;
    await this.gmailAccountRepo.update(
      { id: account.id },
      { lastPulledAt: pulledAt },
    );
  }
}
