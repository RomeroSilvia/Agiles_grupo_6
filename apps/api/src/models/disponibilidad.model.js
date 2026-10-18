import { z } from 'zod';
import { TIPOS_OFERTA } from '@buscador/shared/constants';
import { httpUrlSchema, regionSchema } from '@buscador/shared/schemas';

export const DISPONIBILIDAD_COLUMNS = 'plataforma_id, tipo_oferta, deep_link, verificada_en';
export const DISPONIBILIDAD_PRIMARY_KEY = 'titulo_id,plataforma_id,region,tipo_oferta';

export function fromRow(row) {
  return {
    plataformaId: row.plataforma_id,
    tipoOferta: row.tipo_oferta,
    deepLink: row.deep_link,
    verificadaEn: new Date(row.verificada_en),
  };
}

export function toRow({
  tituloId,
  plataformaId,
  region,
  tipoOferta,
  deepLink,
  fuenteId,
  verificadaEn,
}) {
  return {
    titulo_id: tituloId,
    plataforma_id: plataformaId,
    region,
    tipo_oferta: tipoOferta,
    deep_link: deepLink,
    fuente_id: fuenteId,
    verificada_en: verificadaEn.toISOString(),
  };
}

export const disponibilidadSchema = z.object({
  region: regionSchema,
  ofertas: z.array(
    z.object({
      tipoOferta: z.enum(TIPOS_OFERTA),
      plataformas: z.array(
        z.object({
          id: z.number().int().positive(),
          tmdbProviderId: z.number().int().positive(),
          nombre: z.string().min(1),
          logoPath: z.string().min(1).nullable(),
          urlHome: httpUrlSchema.nullable(),
          deepLink: httpUrlSchema.nullable(),
        }),
      ),
    }),
  ),
  enlaceTmdb: httpUrlSchema.nullable(),
});
