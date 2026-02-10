import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { BankAccountType } from '../entities/BankAccount';

export class CreateBankAccountDto {
  @ApiProperty({ example: 'Nubank', description: 'Account name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1000, description: 'Initial balance' })
  @IsNumber()
  @IsNotEmpty()
  initialBalance: number;

  @ApiProperty({
    example: 'CHECKING',
    enum: BankAccountType,
    description: 'Account type',
  })
  @IsNotEmpty()
  @IsEnum(BankAccountType)
  type: BankAccountType;

  @ApiProperty({ example: '#7950F2', description: 'Account color (hex)' })
  @IsString()
  @IsNotEmpty()
  @IsHexColor()
  color: string;
}
