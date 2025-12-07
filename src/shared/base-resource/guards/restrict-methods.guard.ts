import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RESTRICT_METHODS_KEY,
  RestrictMethodsOptions,
} from '../decorators/restrict-methods.decorator';

@Injectable()
export class RestrictMethodsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RestrictMethodsOptions>(
      RESTRICT_METHODS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const handler = context.getHandler();
    const methodName = handler.name;

    if (options.only?.length) {
      return this.checkAllow(methodName, options.only);
    }

    if (options.except?.length) {
      return this.checkExcept(methodName, options.except);
    }

    return true;
  }

  private checkAllow(current: string, allowed: string[]): boolean {
    console.log(1111);
    if (!allowed.includes(current)) {
      throw new ForbiddenException();
    }
    return true;
  }

  private checkExcept(current: string, denied: string[]): boolean {
    if (denied.includes(current)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
