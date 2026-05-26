import { IsEnum, IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class CreateInventoryMovementDto {
  @IsNotEmpty()
  @IsEnum(['Entrada', 'Salida'], {
    message: 'El tipo de movimiento debe ser Entrada o Salida',
  })
  tipo_mov: 'Entrada' | 'Salida';

  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;

  @IsString()
  @IsNotEmpty()
  razon: string;

  @IsNumber()
  id_producto: number;
}
