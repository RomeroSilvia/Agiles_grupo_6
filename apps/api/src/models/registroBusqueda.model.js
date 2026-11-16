import { z } from 'zod';
import { GENEROS_BUSQUEDA_IDS, TIPOS_TITULO } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';

const MAX_LARGO_TEXTO_REGISTRO = 100;

export const registroBusquedaSchema = z.object({
  texto: z.string().min(1).max(MAX_LARGO_TEXTO_REGISTRO).nullable(),
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
