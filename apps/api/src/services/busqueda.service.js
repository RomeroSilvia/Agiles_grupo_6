import { PAGINA_MAXIMA, TIPO_TITULO } from '@buscador/shared/constants';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import { respuestaBusquedaSchema } from '../models/busqueda.model.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';

const PAGINAS_A_REVISAR_POR_BUSQUEDA = 5;

async function buscarPagina({ q, tipo, anio, pagina, genero, actor, director }) {
  const params = Object.fromEntries(
    Object.entries({ q, anio, pagina, genero, actor, director }).filter(
      ([, valor]) => valor !== undefined,
    ),
  );
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

export async function buscarTitulos(filtros, { avanzarSiVacio = true } = {}) {
  const tieneFiltrosAvanzados = [filtros.genero, filtros.actor, filtros.director].some(
    (valor) => valor !== undefined,
  );
  const ultimaPagina =
    tieneFiltrosAvanzados && avanzarSiVacio
      ? Math.min(PAGINA_MAXIMA, filtros.pagina + PAGINAS_A_REVISAR_POR_BUSQUEDA - 1)
      : filtros.pagina;
  let respuesta;

  for (let pagina = filtros.pagina; pagina <= ultimaPagina; pagina += 1) {
    respuesta = await buscarPagina({ ...filtros, pagina });
    if (
      !tieneFiltrosAvanzados ||
      respuesta.resultados.length > 0 ||
      pagina >= respuesta.totalPaginas
    ) {
      return respuesta;
    }
  }

  return respuesta;
}

export async function listarGeneros() {
  return tmdbIntegration.listarGeneros();
}

export async function buscarPersonas(filtros) {
  return tmdbIntegration.buscarPersonas(filtros);
}
