import { IsString, IsNumber, Min, IsOptional, IsDateString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNumber()
  @Min(0)
  salePrice: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  minStock: number;

  @IsString()
  status: string;

  @IsNumber()
  categoryId: number;

}
