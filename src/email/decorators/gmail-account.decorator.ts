import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { EmailAccountContext } from '../types/email-account.type';

export const GmailAccountCtx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): EmailAccountContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.gmailAccount;
  },
);
