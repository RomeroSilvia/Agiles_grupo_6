import { z } from 'zod';
import { TIPOS_OFERTA } from '@buscador/shared/constants';
import { httpUrlSchema, regionSchema } from '@buscador/shared/schemas';

export const DISPONIBILIDAD_COLUMNS =
  'titulo_id, plataforma_id, region, tipo_oferta, deep_link, fuente_id, detectada_en, verificada_en, vigente';
export const DISPONIBILIDAD_PRIMARY_KEY = 'titulo_id,plataforma_id,region,tipo_oferta';

export function fromRow(row) {
  return {
    tituloId: row.titulo_id,
    plataformaId: row.plataforma_id,
    region: row.region,
    tipoOferta: row.tipo_oferta,
    deepLink: row.deep_link,
    fuenteId: row.fuente_id,
    detectadaEn: new Date(row.detectada_en),
    verificadaEn: new Date(row.verificada_en),
    vigente: row.vigente,
  };
}

function toIsoString(value) {
  return value instanceof Date ? value.toISOString() : value;
}

export function toSnapshotRow(oferta) {
  return {
    titulo_id: oferta.tituloId,
    plataforma_id: oferta.plataformaId,
    region: oferta.region,
    tipo_oferta: oferta.tipoOferta,
    deep_link: oferta.deepLink,
    fuente_id: oferta.fuenteId,
    detectada_en: toIsoString(oferta.detectadaEn),
    verificada_en: toIsoString(oferta.verificadaEn),
    vigente: oferta.vigente,
  };
}

// El deep link completa la disponibilidad y no modifica el snapshot del job.
export function toDeepLinkRow(disponibilidad) {
  return {
    titulo_id: disponibilidad.tituloId,
    plataforma_id: disponibilidad.plataformaId,
    region: disponibilidad.region,
    tipo_oferta: disponibilidad.tipoOferta,
    deep_link: disponibilidad.deepLink,
    fuente_id: disponibilidad.fuenteId,
    verificada_en: toIsoString(disponibilidad.verificadaEn),
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
