import { IsNotEmpty } from 'class-validator';

export class CodeDto {
  @IsNotEmpty()
  code: string;
}
