import { respuestaBusquedaSchema } from '@buscador/shared/schemas';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { ExternalServiceError } from '../errors/index.js';

function obtenerAnio(fecha) {
  const anio = fecha?.slice(0, 4);
  return /^\d{4}$/.test(anio ?? '') ? Number(anio) : null;
}

function normalizarResultado(item, tipo) {
  const fecha = tipo === 'pelicula' ? item.release_date : item.first_air_date;
  const puntuacion = Number.isFinite(item.vote_average) ? Number(item.vote_average) : null;

  return {
    tmdbId: item.id,
    tipo,
    nombre: item.title ?? item.name ?? 'Sin título',
    anio: obtenerAnio(fecha),
    posterPath: item.poster_path ?? null,
    puntuacion,
    relevancia: Number.isFinite(item.popularity) ? item.popularity : 0,
  };
}

function normalizarRespuesta(response, tipo) {
  return {
    resultados: (response.results ?? []).map((item) => normalizarResultado(item, tipo)),
    totalResultados: response.total_results ?? 0,
    totalPaginas: response.total_pages ?? 0,
  };
}

export async function buscarTitulos({ q, tipo, anio, pagina }) {
  const params = { q, anio, pagina };
  let respuestas;

  if (tipo === 'pelicula') {
    respuestas = [normalizarRespuesta(await tmdbIntegration.buscarPeliculas(params), 'pelicula')];
  } else if (tipo === 'serie') {
    respuestas = [normalizarRespuesta(await tmdbIntegration.buscarSeries(params), 'serie')];
  } else {
    const [peliculas, series] = await Promise.all([
      tmdbIntegration.buscarPeliculas(params),
      tmdbIntegration.buscarSeries(params),
    ]);
    respuestas = [normalizarRespuesta(peliculas, 'pelicula'), normalizarRespuesta(series, 'serie')];
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
