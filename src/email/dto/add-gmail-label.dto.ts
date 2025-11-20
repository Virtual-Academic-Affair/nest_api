import { IsNotEmpty, IsString } from 'class-validator';

export class AddGmailLabelDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  labelId: string;
}
