import { TIPO_TITULO } from '@buscador/shared/constants';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { ExternalServiceError } from '../errors/index.js';
import { respuestaBusquedaSchema } from '../models/busqueda.model.js';

function validarRespuesta(respuesta) {
  const resultado = respuestaBusquedaSchema.safeParse(respuesta);

  if (!resultado.success) {
    throw new ExternalServiceError('TMDB', resultado.error);
  }

  return resultado.data;
}

export async function buscarTitulos({ q, tipo, anio, pagina }) {
  const params = { q, anio, pagina };
  let respuestas;

  if (tipo === TIPO_TITULO.PELICULA) {
    respuestas = [validarRespuesta(await tmdbIntegration.buscarPeliculas(params))];
  } else if (tipo === TIPO_TITULO.SERIE) {
    respuestas = [validarRespuesta(await tmdbIntegration.buscarSeries(params))];
  } else {
    const [peliculas, series] = await Promise.all([
      tmdbIntegration.buscarPeliculas(params),
      tmdbIntegration.buscarSeries(params),
    ]);
    respuestas = [validarRespuesta(peliculas), validarRespuesta(series)];
  }

  const resultados = respuestas
    .flatMap((respuesta) => respuesta.resultados)
    .sort((a, b) => b.relevancia - a.relevancia)
    .map(({ relevancia: _relevancia, ...resultado }) => resultado);

  const respuesta = respuestaBusquedaSchema.safeParse({
    resultados,
    pagina,
    totalResultados: respuestas.reduce((total, respuesta) => total + respuesta.totalResultados, 0),
    totalPaginas: Math.max(...respuestas.map((respuesta) => respuesta.totalPaginas)),
  });

  if (!respuesta.success) {
    throw new ExternalServiceError('TMDB', respuesta.error);
  }

  return respuesta.data;
}
