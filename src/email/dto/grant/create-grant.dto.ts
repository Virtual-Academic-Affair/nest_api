import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGrantDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
