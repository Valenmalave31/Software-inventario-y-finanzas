import { IsString, IsNumber, IsNotEmpty, IsDateString, IsPositive } from 'class-validator';

export class CreateTargetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  targetAmount: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  calculationType: string;
}