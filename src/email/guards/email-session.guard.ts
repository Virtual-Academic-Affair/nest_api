import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { EmailService } from '../email.service';
import { GmailAccount } from '../entities/email-account.entity';
import { Role } from '@shared/authorization/enums/role.enum';

declare module 'express' {
  interface Request {
    gmailAccount?: GmailAccount;
  }
}

@Injectable()
export class EmailSessionGuard implements CanActivate {
  constructor(private readonly emailService: EmailService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Thieu Gmail session token.');
    }

    const account = await this.emailService.validateSession(token).catch(() => {
      throw new UnauthorizedException('Gmail session token khong hop le.');
    });

    if (!account.user || account.user.role !== Role.Admin) {
      throw new ForbiddenException('Yeu cau quyen admin de dung Gmail module.');
    }

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
