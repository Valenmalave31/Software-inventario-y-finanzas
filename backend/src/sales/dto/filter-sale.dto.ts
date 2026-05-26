import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';

export class FilterSaleDto {
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @MaxLength(255, { message: 'Search term cannot exceed 255 characters' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'From date must be a string' })
  from?: string;

  @IsOptional()
  @IsString({ message: 'To date must be a string' })
  to?: string;

  @IsOptional()
  @IsEnum(['Efectivo', 'Transferencia', 'Débito', 'Crédito'], {
    message: 'Payment method must be one of: Efectivo, Transferencia, Débito, Crédito',
  })
  payment?: string;
}
