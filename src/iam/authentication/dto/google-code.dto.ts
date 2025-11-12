import { IsNotEmpty } from 'class-validator';

export class GoogleCodeDto {
  @IsNotEmpty()
  code: string;
}
