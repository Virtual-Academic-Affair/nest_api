import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { GenerateAuthUrlOpts } from 'google-auth-library';
import { google, gmail_v1 } from 'googleapis';
import { In, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/users/enums/role.enum';
import { AddGmailTagDto } from './dto/add-gmail-tag.dto';
import { CreateGmailTagDto } from './dto/create-gmail-tag.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { RegisterGmailAccountDto } from './dto/register-gmail-account.dto';
import { ReplyMailDto } from './dto/reply-mail.dto';
import { GmailAccount } from './entities/gmail-account.entity';
import { GmailTag } from './entities/gmail-tag.entity';
import { GmailEmail } from './entities/gmail-email.entity';

const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private readonly sessionSecret: string;
  private readonly sessionTtl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(GmailAccount)
    private readonly gmailAccountRepo: Repository<GmailAccount>,
    @InjectRepository(GmailTag)
    private readonly gmailTagRepo: Repository<GmailTag>,
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
        'Thiếu cấu hình GMAIL_SESSION_SECRET.',
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
        'Không lấy được email từ Gmail profile.',
      );
    }

    const user = await this.usersRepository.findOne({
      where: { email: profile.emailAddress },
    });

    if (
      !user ||
      ![Role.Admin, Role.Lecture].includes(user.role as Role)
    ) {
      throw new ForbiddenException(
        'Email này chưa được cấp quyền sử dụng module Gmail.',
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
        'Google không trả refresh token. Vui lòng chọn "Yêu cầu cấp quyền lại" và thử lại.',
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
      throw new NotFoundException('Không tìm thấy tài khoản Gmail.');
    }
    return account;
  }

  async getTags(account: GmailAccount) {
    const client = await this.getClient(account);
    const { data } = await client.users.labels.list({ userId: 'me' });
    const labels = data.labels ?? [];
    await this.upsertTags(account, labels);
    return labels;
  }

  async getTagsForEmail(account: GmailAccount, messageId: string) {
    const email = await this.gmailEmailRepo.findOne({
      where: {
        gmailAccount: { id: account.id },
        gmailMessageId: messageId,
      },
      relations: ['tags'],
    });

    if (!email) {
      throw new NotFoundException('Không tìm thấy email với messageId này.');
    }

    return email.tags ?? [];
  }

  async createTag(account: GmailAccount, dto: CreateGmailTagDto) {
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
      await this.upsertTags(account, [data]);
    }
    return data;
  }

  async addTagToMail(account: GmailAccount, dto: AddGmailTagDto) {
    const client = await this.getClient(account);
    const { data } = await client.users.messages.modify({
      userId: 'me',
      id: dto.messageId,
      requestBody: {
        addLabelIds: [dto.tagId],
      },
    });

    const tag = await this.ensureTag(account, dto.tagId);
    if (tag) {
      const email = await this.gmailEmailRepo.findOne({
        where: { gmailMessageId: dto.messageId },
        relations: ['tags'],
      });
      if (email) {
        const tagExists = email.tags?.some(
          (existing) => existing.id === tag.id,
        );
        if (!tagExists) {
          email.tags = [...(email.tags ?? []), tag];
          await this.gmailEmailRepo.save(email);
        }
      }
    }

    return data;
  }

  async readAllMails(account: GmailAccount, query: ListMessagesQueryDto) {
    const client = await this.getClient(account);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const queryString = `-from:me newer_than:2d`;
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
      return [];
    }

    const newMessageIds = collectedMessages
      .map((message) => message.id)
      .filter((id): id is string => !!id);

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
      return [];
    }

    const { data: labelsData } = await client.users.labels.list({
      userId: 'me',
    });
    const tagMap = await this.upsertTags(account, labelsData.labels ?? []);

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

        if (internalDate && internalDate < twoDaysAgo) {
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

    await this.persistEmails(account, cleanDetails, tagMap);

    return cleanDetails;
  }

  async getStoredEmails(account: GmailAccount, query: ListMessagesQueryDto) {
    return this.gmailEmailRepo.find({
      where: { gmailAccount: { id: account.id } },
      relations: ['tags'],
      order: { internalDate: 'DESC', createdAt: 'DESC' },
      take: query.limit ?? 20,
      skip: query.skip ?? 0,
    });
  }

  async getAllStoredEmails(account: GmailAccount) {
    return this.gmailEmailRepo.find({
      where: { gmailAccount: { id: account.id } },
      relations: ['tags'],
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

    const rawMessage = rawLines.join("\r\n"); // ✔ MUST USE CRLF

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_"); // ✔ keep padding (=)

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
        'Thiếu cấu hình GMAIL_CLIENT_ID/SECRET/REDIRECT_URI.',
      );
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  private async getClient(account: GmailAccount) {
    const oauthClient = this.createOAuthClient();
    oauthClient.setCredentials({ refresh_token: account.refreshToken });
    return google.gmail({ version: 'v1', auth: oauthClient });
  }

  private async ensureTag(account: GmailAccount, tagId: string) {
    if (!tagId) {
      return null;
    }
    let tag = await this.gmailTagRepo.findOne({
      where: {
        gmailAccount: { id: account.id },
        gmailTagId: tagId,
      },
    });
    if (tag) {
      return tag;
    }
    const client = await this.getClient(account);
    const { data } = await client.users.labels.get({
      userId: 'me',
      id: tagId,
    });
    const map = await this.upsertTags(account, data ? [data] : []);
    return map.get(tagId) ?? null;
  }

  private async upsertTags(
    account: GmailAccount,
    labels: gmail_v1.Schema$Label[] = [],
  ) {
    const existing = await this.gmailTagRepo.find({
      where: { gmailAccount: { id: account.id } },
    });
    const existingMap = new Map(existing.map((tag) => [tag.gmailTagId, tag]));
    const toSave: GmailTag[] = [];

    for (const label of labels) {
      if (!label?.id) continue;
      const entity =
        existingMap.get(label.id) ??
        this.gmailTagRepo.create({
          gmailAccount: account,
          gmailTagId: label.id,
        });
      entity.name = label.name ?? entity.name ?? label.id;
      entity.type = label.type ?? entity.type;
      entity.color = label.color?.backgroundColor ?? entity.color;
      existingMap.set(label.id, entity);
      toSave.push(entity);
    }

    if (toSave.length) {
      await this.gmailTagRepo.save(toSave);
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
    tagMap: Map<string, GmailTag>,
  ) {
    const ids = messages
      .map((message) => message.id)
      .filter((id): id is string => !!id);
    if (!ids.length) {
      return;
    }

    const existing = await this.gmailEmailRepo.find({
      where: { gmailMessageId: In(ids) },
      relations: ['tags'],
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
      entity.tags =
        message.labelIds
          ?.map((labelId) => tagMap.get(labelId))
          .filter((tag): tag is GmailTag => !!tag) ?? [];

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
}
