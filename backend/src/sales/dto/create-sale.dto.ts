import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductoVentaDto {
  @IsNumber()
  id_producto: number;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precio_unitario: number;
}

export class CreateSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductoVentaDto)
  productos: ProductoVentaDto[];

  @IsNumber()
  descuento_total: number;

  @IsString()
  metodo_pago: string;
}
