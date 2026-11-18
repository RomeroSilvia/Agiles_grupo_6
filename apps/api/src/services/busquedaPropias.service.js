import { PAGINA_MAXIMA } from '@buscador/shared/constants';
import { FILTRO_PLATAFORMAS } from '../config/busqueda.config.js';
import { ExternalServiceError } from '../errors/index.js';
import * as usuarioPlataformaRepository from '../repositories/usuarioPlataforma.repository.js';
import * as busquedaService from './busqueda.service.js';
import * as usuarioPlataformaService from './usuarioPlataforma.service.js';

function respuestaVacia(pagina) {
  return {
    resultados: [],
    pagina,
    totalPaginas: 0,
    totalResultados: 0,
    verificacionIncompleta: false,
  };
}

async function filtrarPagina({ buscarPagina, pagina, region, plataformas }) {
  const { resultados, totalPaginas, totalResultados } = await buscarPagina(pagina);
  const disponibilidades = await usuarioPlataformaService.obtenerPlataformasDelUsuarioPorTitulo({
    titulos: resultados,
    region,
    plataformas,
  });

  if (resultados.length > 0 && disponibilidades.every(({ verificado }) => !verificado)) {
    throw new ExternalServiceError('TMDB', new Error('No se pudo verificar ningún título'));
  }

  return {
    totalPaginas,
    totalResultados,
    verificacionIncompleta: disponibilidades.some(({ verificado }) => !verificado),
    resultados: resultados
      .map((titulo, indice) => ({ ...titulo, plataformas: disponibilidades[indice].plataformas }))
      .filter((titulo) => titulo.plataformas.length > 0),
  };
}

// Recorre páginas de una búsqueda cualquiera (`buscarPagina`) y deja solo los títulos que están
// en las plataformas del usuario, hasta juntar suficientes o llegar al límite de páginas.
export async function filtrarEnPlataformasPropias({ buscarPagina, pagina, usuarioId, region }) {
  const plataformas =
    await usuarioPlataformaRepository.listarPlataformasActivasPorUsuario(usuarioId);

  const respuesta = respuestaVacia(pagina);

  if (plataformas.length === 0) {
    return respuesta;
  }

  for (
    let paginaActual = pagina;
    paginaActual < pagina + FILTRO_PLATAFORMAS.MAX_PAGINAS_POR_REQUEST;
    paginaActual += 1
  ) {
    const filtrada = await filtrarPagina({
      buscarPagina,
      pagina: paginaActual,
      region,
      plataformas,
    });

    respuesta.pagina = paginaActual;
    respuesta.totalPaginas = filtrada.totalPaginas;
    respuesta.totalResultados = filtrada.totalResultados;
    respuesta.verificacionIncompleta ||= filtrada.verificacionIncompleta;
    respuesta.resultados.push(...filtrada.resultados);

    const ultimaPagina = Math.min(filtrada.totalPaginas, PAGINA_MAXIMA);
    if (
      respuesta.resultados.length >= FILTRO_PLATAFORMAS.RESULTADOS_OBJETIVO ||
      paginaActual >= ultimaPagina
    ) {
      break;
    }
  }

  return respuesta;
}

export function buscarTitulosEnPlataformasPropias({ filtros, usuarioId, region }) {
  return filtrarEnPlataformasPropias({
    buscarPagina: (pagina) =>
      busquedaService.buscarTitulos({ ...filtros, pagina }, { avanzarSiVacio: false }),
    pagina: filtros.pagina,
    usuarioId,
    region,
  });
}
