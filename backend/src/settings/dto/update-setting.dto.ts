import { IsArray, IsNumber, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MetodoPagoDto {
  @IsString()
  nombre: string;

  @IsBoolean()
  activo: boolean;
}

export class UpdateSettingDto {
  @IsOptional()
  @IsNumber()
  impuesto?: number;

  @IsOptional()
  @IsBoolean()
  retencionActiva?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetodoPagoDto)
  metodosPago?: MetodoPagoDto[];

@IsOptional()
  @IsArray()
  notificacionesConfig?: any[];

  @IsBoolean()
  @IsOptional()
  enviarEmailAlertas?: boolean;
}