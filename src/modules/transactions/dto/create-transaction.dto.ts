import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { TransactionType } from '../entities/Transaction';

export class CreateTransactionDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Bank account UUID',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Category UUID',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Salary', description: 'Transaction name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 5000, description: 'Transaction value (positive)' })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  value: number;

  @ApiProperty({
    example: '2024-01-15T00:00:00.000Z',
    description: 'Transaction date (ISO 8601)',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: 'INCOME',
    enum: TransactionType,
    description: 'Transaction type',
  })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;
}
