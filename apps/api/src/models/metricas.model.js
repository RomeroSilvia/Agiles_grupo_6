import { z } from 'zod';
import { TIPOS_TITULO } from '@buscador/shared/constants';
import { regionSchema } from '@buscador/shared/schemas';

const cantidadSchema = z.number().int().min(0);

function rankingSchema(clave, valorSchema) {
  return z.array(z.object({ [clave]: valorSchema, cantidad: cantidadSchema }));
}

const rankingGeneroSchema = rankingSchema('genero', z.string().min(1));
const rankingTipoSchema = rankingSchema('tipo', z.enum(TIPOS_TITULO));
const rankingRegionSchema = rankingSchema('region', regionSchema);

const metricasRowSchema = z.object({
  totales: z.object({
    usuarios: cantidadSchema,
    usuariosNuevos: cantidadSchema,
    titulosWatchlist: cantidadSchema,
    titulosWatchlistNuevos: cantidadSchema,
    regionesActivas: cantidadSchema,
    plataformasElegidas: cantidadSchema,
  }),
  watchlist: z.object({
    generos: rankingGeneroSchema,
    tipos: rankingTipoSchema,
    regiones: rankingRegionSchema,
  }),
  busquedas: z.object({
    textos: rankingSchema('texto', z.string().min(1)),
    generos: rankingGeneroSchema,
    tipos: rankingTipoSchema,
    regiones: rankingRegionSchema,
  }),
  plataformas: rankingSchema('plataformaId', z.number().int().positive()),
});

export function fromRow(row) {
  const { totales, watchlist, busquedas, plataformas } = metricasRowSchema.parse(row);

  return {
    totales,
    rankings: {
      genero: { watchlist: watchlist.generos, busquedas: busquedas.generos },
      tipo: { watchlist: watchlist.tipos, busquedas: busquedas.tipos },
      region: { watchlist: watchlist.regiones, busquedas: busquedas.regiones },
      plataforma: plataformas,
      textosBuscados: busquedas.textos,
    },
  };
}
