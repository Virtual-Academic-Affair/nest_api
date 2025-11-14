import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGmailTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
