import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SigninDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '12345678',
    description: 'User password (min 8 chars)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
