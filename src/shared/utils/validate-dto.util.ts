import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

export async function validateDto<T>(
  DtoClass: new () => T,
  data: any,
): Promise<T> {
  const dto = plainToInstance(DtoClass, data, {
    enableImplicitConversion: true,
  });

  try {
    await validateOrReject(dto as object, {
      whitelist: true,
    });
  } catch (errors) {
    const messages = errors
      .map((err: { constraints: any }) => Object.values(err.constraints ?? {}))
      .flat();

    throw new BadRequestException(messages);
  }

  return dto;
}
