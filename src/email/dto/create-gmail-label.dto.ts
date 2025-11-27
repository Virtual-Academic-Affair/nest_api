import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGmailLabelDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
