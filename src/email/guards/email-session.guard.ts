import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { EmailService } from '../services/email.service';
import { EmailAccountContext } from '../types/email-account.type';
import { Role } from '@shared/authorization/enums/role.enum';

declare module 'express' {
  interface Request {
    gmailAccount?: EmailAccountContext;
  }
}

@Injectable()
export class EmailSessionGuard implements CanActivate {
  constructor(private readonly emailService: EmailService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing Gmail session token.');
    }

    const account = await this.emailService.validateSession(token).catch(() => {
      throw new UnauthorizedException('Invalid Gmail session token.');
    });

    if (!account.user || account.user.role !== Role.Admin) {
      throw new ForbiddenException('Admin role is required to use the Email module.');
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
