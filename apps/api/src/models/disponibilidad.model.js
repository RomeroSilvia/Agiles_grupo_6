import { z } from 'zod';
import { TIPOS_OFERTA } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';

export const DISPONIBILIDAD_COLUMNS =
  'titulo_id, plataforma_id, region, tipo_oferta, deep_link, fuente_id, detectada_en, verificada_en, vigente';
export const DISPONIBILIDAD_PRIMARY_KEY = 'titulo_id,plataforma_id,region,tipo_oferta';

export function fromSnapshotRow(row) {
  return {
    tituloId: row.titulo_id,
    plataformaId: row.plataforma_id,
    region: row.region,
    tipoOferta: row.tipo_oferta,
    deepLink: row.deep_link,
    fuenteId: row.fuente_id,
    detectadaEn: row.detectada_en,
    verificadaEn: row.verificada_en,
    vigente: row.vigente,
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
          urlHome: z.url().nullable(),
        }),
      ),
    }),
  ),
  enlaceTmdb: z.url().nullable(),
});
