import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { GmailService } from '../gmail.service';
import { GmailAccount } from '../entities/gmail-account.entity';

declare module 'express' {
  interface Request {
    gmailAccount?: GmailAccount;
  }
}

@Injectable()
export class GmailSessionGuard implements CanActivate {
  constructor(private readonly gmailService: GmailService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Thiếu Gmail session token.');
    }

    const account = await this.gmailService.validateSession(token).catch(() => {
      throw new UnauthorizedException('Gmail session token không hợp lệ.');
    });

    request.gmailAccount = account;
    return true;
  }

  private extractToken(request: Request) {
    const header = request.headers.authorization;
    if (!header) return null;
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }
    return token;
  }
}
