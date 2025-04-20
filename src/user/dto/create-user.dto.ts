import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsObject, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class EmailSettings {
  @ApiProperty({ description: 'Email server host', example: 'imap.gmail.com' })
  @IsNotEmpty()
  host: string;

  @ApiProperty({ description: 'Email server port', example: 993 })
  @IsNumber()
  port: number;

  @ApiProperty({ description: 'Whether to use SSL/TLS', example: true })
  @IsBoolean()
  secure: boolean;
}

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Email account password' })
  @IsNotEmpty()
  emailPassword: string;

  @ApiProperty({
    description: 'Email provider settings',
    type: EmailSettings,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => EmailSettings)
  emailSettings: EmailSettings;
}