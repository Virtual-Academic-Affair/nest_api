import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterGmailAccountDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
