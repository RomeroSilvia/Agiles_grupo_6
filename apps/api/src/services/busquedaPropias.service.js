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

async function filtrarPagina({ filtros, pagina, region, plataformas }) {
  const { resultados, totalPaginas, totalResultados } = await busquedaService.buscarTitulos({
    ...filtros,
    pagina,
  });
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

export async function buscarTitulosEnPlataformasPropias({ filtros, usuarioId, region }) {
  const plataformas =
    await usuarioPlataformaRepository.listarPlataformasActivasPorUsuario(usuarioId);

  const respuesta = respuestaVacia(filtros.pagina);

  if (plataformas.length === 0) {
    return respuesta;
  }

  for (
    let pagina = filtros.pagina;
    pagina < filtros.pagina + FILTRO_PLATAFORMAS.MAX_PAGINAS_POR_REQUEST;
    pagina += 1
  ) {
    const filtrada = await filtrarPagina({ filtros, pagina, region, plataformas });

    respuesta.pagina = pagina;
    respuesta.totalPaginas = filtrada.totalPaginas;
    respuesta.totalResultados = filtrada.totalResultados;
    respuesta.verificacionIncompleta ||= filtrada.verificacionIncompleta;
    respuesta.resultados.push(...filtrada.resultados);

    const ultimaPagina = Math.min(filtrada.totalPaginas, PAGINA_MAXIMA);
    if (
      respuesta.resultados.length >= FILTRO_PLATAFORMAS.RESULTADOS_OBJETIVO ||
      pagina >= ultimaPagina
    ) {
      break;
    }
  }

  return respuesta;
}
