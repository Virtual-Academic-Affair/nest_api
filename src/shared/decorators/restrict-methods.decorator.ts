import { SetMetadata } from '@nestjs/common';
import { HttpMethod } from '../enums/http-method.enum';

export const RESTRICT_METHODS_KEY = 'restrictMethods';

export interface RestrictMethodsOptions {
  only?: HttpMethod[];
  except?: HttpMethod[];
}

export const RestrictMethods = (options: RestrictMethodsOptions) =>
  SetMetadata(RESTRICT_METHODS_KEY, options);
