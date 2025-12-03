import { SetMetadata } from '@nestjs/common';

export const RESTRICT_METHODS_KEY = 'restrictMethods';

export interface RestrictMethodsOptions {
  only?: string[];
  except?: string[];
}

export const RestrictMethods = (options: RestrictMethodsOptions) =>
  SetMetadata(RESTRICT_METHODS_KEY, options);
