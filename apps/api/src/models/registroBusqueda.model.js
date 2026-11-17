import { z } from 'zod';
import {
  GENEROS_BUSQUEDA_IDS,
  MAX_LARGO_TEXTO_BUSQUEDA,
  TIPOS_TITULO,
} from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';

export const registroBusquedaSchema = z.object({
  texto: z.string().min(1).max(MAX_LARGO_TEXTO_BUSQUEDA).nullable(),
  tipo: z.enum(TIPOS_TITULO).nullable(),
  genero: z.enum(GENEROS_BUSQUEDA_IDS).nullable(),
  region: regionSchema.nullable(),
});

export function toRow(registro) {
  const data = registroBusquedaSchema.parse(registro);

  return {
    texto: data.texto,
    tipo: data.tipo,
    genero: data.genero,
    region: data.region,
  };
}
