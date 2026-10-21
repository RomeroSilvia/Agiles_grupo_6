import { z } from 'zod';
import { regionSchema } from '@buscador/shared/schemas';

export const VERIFICACION_DISPONIBILIDAD_COLUMNS = 'titulo_id, region, verificada_en';

const verificacionDisponibilidadRowSchema = z.object({
  titulo_id: z.number().int().positive(),
  region: regionSchema,
  verificada_en: z.string().min(1),
});

export function fromRow(row) {
  const data = verificacionDisponibilidadRowSchema.parse(row);

  return {
    tituloId: data.titulo_id,
    region: data.region,
    verificadaEn: data.verificada_en,
  };
}
