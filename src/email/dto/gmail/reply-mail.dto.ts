import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReplyMailDto {
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @IsEmail()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsOptional()
  messageId?: string;
}
