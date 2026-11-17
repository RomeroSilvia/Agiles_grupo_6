import { PAGINA_MAXIMA, TIPO_TITULO } from '@buscador/shared/constants';
import { CRITERIOS_ANIMO } from '../config/animo.config.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { respuestaTmdbBusquedaSchema } from '../models/busqueda.model.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';
import * as busquedaService from './busqueda.service.js';
import * as busquedaPropiasService from './busquedaPropias.service.js';

const TIPOS_ANIMO = Object.freeze([TIPO_TITULO.PELICULA, TIPO_TITULO.SERIE]);

async function buscarTipoPorAnimo({ animo, tipo, pagina }) {
  const { puntuacionMinima } = CRITERIOS_ANIMO[animo];
  const { generosIncluidos, generosExcluidos, votosMinimos } = CRITERIOS_ANIMO[animo][tipo];
  const respuesta = validateExternalResponse(
    respuestaTmdbBusquedaSchema,
    await tmdbIntegration.descubrirTitulos({
      tipo,
      generoIds: generosIncluidos,
      generosExcluidos,
      puntuacionMinima,
      votosMinimos,
      pagina,
    }),
  );

  // TMDB ya filtra por estos criterios. Se repite el control para no mostrar un título que no
  // corresponde si la respuesta no los respetó.
  const excluidos = new Set(generosExcluidos);
  return {
    ...respuesta,
    resultados: respuesta.resultados.filter(
      (titulo) =>
        titulo.generoIds.some((id) => generosIncluidos.includes(id)) &&
        !titulo.generoIds.some((id) => excluidos.has(id)) &&
        (titulo.puntuacion ?? 0) >= puntuacionMinima,
    ),
  };
}

export async function buscarTitulosPorAnimo({ animo, pagina }) {
  const respuestas = await Promise.all(
    TIPOS_ANIMO.map((tipo) => buscarTipoPorAnimo({ animo, tipo, pagina })),
  );
  const respuesta = busquedaService.combinarRespuestas(respuestas, pagina);

  return { ...respuesta, totalPaginas: Math.min(respuesta.totalPaginas, PAGINA_MAXIMA) };
}

export function buscarTitulosPorAnimoEnPlataformasPropias({ animo, pagina, usuarioId, region }) {
  return busquedaPropiasService.filtrarEnPlataformasPropias({
    buscarPagina: (paginaActual) => buscarTitulosPorAnimo({ animo, pagina: paginaActual }),
    pagina,
    usuarioId,
    region,
  });
}
