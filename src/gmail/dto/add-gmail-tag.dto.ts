import { IsNotEmpty, IsString } from 'class-validator';

export class AddGmailTagDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  tagId: string;
}
