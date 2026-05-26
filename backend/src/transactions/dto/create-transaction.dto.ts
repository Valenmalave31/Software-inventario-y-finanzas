import { IsString, IsNumber, IsNotEmpty, IsDateString, IsOptional, IsPositive, Min, Max} from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  concept: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(1)
  @Max(2)
  typeId: number; 

  @IsNumber()
  @IsNotEmpty()
  categoryId: number; 

  @IsNumber()
  @IsOptional()
  budgetId?: number; 
}