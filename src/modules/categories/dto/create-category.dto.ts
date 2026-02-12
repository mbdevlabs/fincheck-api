import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TransactionType } from 'src/modules/transactions/entities/Transaction';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Salário', description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'salary', description: 'Category icon identifier' })
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ApiProperty({
    example: 'INCOME',
    enum: TransactionType,
    description: 'Category type (INCOME or OUTCOME)',
  })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;
}
