import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';

export class FilterInventoryMovementDto {
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
  @IsEnum(['Entrada', 'Salida'], { message: 'Status must be either Entrada or Salida' })
  status?: string;
}
