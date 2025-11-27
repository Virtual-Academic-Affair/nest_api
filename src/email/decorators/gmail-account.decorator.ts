import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GmailAccount } from '../entities/email-account.entity';

export const GmailAccountCtx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GmailAccount => {
    const request = ctx.switchToHttp().getRequest();
    return request.gmailAccount;
  },
);
