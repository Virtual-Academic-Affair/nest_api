import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpMethod } from '../enums/http-method.enum';
import {
  RESTRICT_METHODS_KEY,
  RestrictMethodsOptions,
} from '../decorators/restrict-methods.decorator';

@Injectable()
export class RestrictMethodsGuard implements CanActivate {
  private readonly httpMethodMap: Record<string, HttpMethod> = {
    GET: HttpMethod.Read,
    POST: HttpMethod.Create,
    PUT: HttpMethod.Update,
    PATCH: HttpMethod.Patch,
    DELETE: HttpMethod.Delete,
  };

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RestrictMethodsOptions>(
      RESTRICT_METHODS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const method = this.httpMethodMap[request.method];

    if (!method) throw new ForbiddenException();

    if (options.only?.length) {
      return this.checkAllowOnly(method, options.only);
    }

    if (options.except?.length) {
      return this.checkExcept(method, options.except);
    }

    return true;
  }

  private checkAllowOnly(current: HttpMethod, allowed: HttpMethod[]): boolean {
    if (!allowed.includes(current)) throw new ForbiddenException();
    return true;
  }

  private checkExcept(current: HttpMethod, denied: HttpMethod[]): boolean {
    if (denied.includes(current)) throw new ForbiddenException();
    return true;
  }
}
