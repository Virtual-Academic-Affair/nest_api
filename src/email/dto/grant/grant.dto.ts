import { IsNotEmpty, IsString } from 'class-validator';

export class GrantDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
