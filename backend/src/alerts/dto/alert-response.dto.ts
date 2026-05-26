export class AlertResponseDto {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  tipo: 'Stock' | 'Pagos' | 'Vencimiento';
  leida: boolean;
  fecha: Date;
}