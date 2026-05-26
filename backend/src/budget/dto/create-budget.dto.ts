import { IsNumber, IsNotEmpty, Min, Max, IsPositive, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBudgetDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  allocated_amount: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(12)
  month: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(2024)
  year: number;

  @IsNumber()
  @IsNotEmpty()
  category_id: number;
}