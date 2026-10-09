import { TIPO_TITULO } from '@buscador/shared/constants';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { respuestaBusquedaSchema } from '../models/busqueda.model.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';

export async function buscarTitulos({ q, tipo, anio, pagina }) {
  const params = { q, anio, pagina };
  let respuestas;

  if (tipo === TIPO_TITULO.PELICULA) {
    respuestas = [
      validateExternalResponse(
        respuestaBusquedaSchema,
        await tmdbIntegration.buscarPeliculas(params),
      ),
    ];
  } else if (tipo === TIPO_TITULO.SERIE) {
    respuestas = [
      validateExternalResponse(respuestaBusquedaSchema, await tmdbIntegration.buscarSeries(params)),
    ];
  } else {
    const [peliculas, series] = await Promise.all([
      tmdbIntegration.buscarPeliculas(params),
      tmdbIntegration.buscarSeries(params),
    ]);
    respuestas = [
      validateExternalResponse(respuestaBusquedaSchema, peliculas),
      validateExternalResponse(respuestaBusquedaSchema, series),
    ];
  }

  const resultados = respuestas
    .flatMap((respuesta) => respuesta.resultados)
    .sort((a, b) => b.relevancia - a.relevancia)
    .map(({ relevancia: _relevancia, ...resultado }) => resultado);

  return validateExternalResponse(respuestaBusquedaSchema, {
    resultados,
    pagina,
    totalResultados: respuestas.reduce((total, respuesta) => total + respuesta.totalResultados, 0),
    totalPaginas: Math.max(...respuestas.map((respuesta) => respuesta.totalPaginas)),
  });
}
