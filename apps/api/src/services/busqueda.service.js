import {
  GENEROS_BUSQUEDA,
  PAGINA_MAXIMA,
  ROL_PERSONA,
  TIPO_TITULO,
} from '@buscador/shared/constants';
import { tieneFiltrosAvanzados } from '@buscador/shared/schemas';
import { z } from 'zod';
import { TMDB_CONFIG } from '../config/tmdb.config.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import {
  creditosPersonaSchema,
  respuestaBusquedaSchema,
  respuestaTmdbBusquedaSchema,
} from '../models/busqueda.model.js';
import { generoSchema } from '../models/genero.model.js';
import { personaSchema, respuestaCreditosCombinadosSchema } from '../models/persona.model.js';
import { NotFoundError } from '../errors/index.js';
import { validateExternalResponse } from '../utils/validateExternalResponse.js';

const TIPOS_BUSQUEDA = Object.freeze([TIPO_TITULO.PELICULA, TIPO_TITULO.SERIE]);

const respuestaPersonasSchema = z.object({
  resultados: z.array(personaSchema),
  totalPaginas: z.number().int().min(0),
});

const generosPorId = new Map(GENEROS_BUSQUEDA.map((genero) => [genero.id, genero]));

function personasDeFiltros(filtros) {
  return [
    ...(filtros.actor === undefined ? [] : [{ personaId: filtros.actor, rol: ROL_PERSONA.ACTOR }]),
    ...(filtros.director === undefined
      ? []
      : [{ personaId: filtros.director, rol: ROL_PERSONA.DIRECTOR }]),
  ];
}

function esCreditoDeRol(creditos, rol) {
  if (rol === ROL_PERSONA.ACTOR) {
    return creditos.cast;
  }

  return creditos.crew.filter(
    (credito) => (credito.puesto ?? credito.job)?.toLocaleLowerCase('en') === 'director',
  );
}

function tieneGenero(item, generoIds) {
  return generoIds === undefined || generoIds.some((id) => item.generoIds.includes(id));
}

function obtenerGeneroIds(filtros, tipo) {
  if (filtros.genero === undefined) {
    return undefined;
  }

  return generosPorId.get(filtros.genero).tmdbIds[tipo];
}

function obtenerAnio(fecha) {
  const anio = typeof fecha === 'string' ? fecha.slice(0, 4) : null;
  return /^\d{4}$/.test(anio ?? '') ? Number(anio) : null;
}

async function obtenerCreditosDePersona({ personaId, rol, tipo }) {
  const respuesta = validateExternalResponse(
    creditosPersonaSchema,
    await tmdbIntegration.obtenerCreditosPersona({ personaId, tipo }),
  );

  return esCreditoDeRol(respuesta, rol);
}

async function normalizarRespuestaFiltrada(respuestaExterna, tipo, filtros, generoIds) {
  const respuesta = validateExternalResponse(respuestaTmdbBusquedaSchema, respuestaExterna);
  const personas = personasDeFiltros(filtros);
  const creditos = await Promise.all(
    personas.map(async ({ personaId, rol }) => {
      const resultados = await obtenerCreditosDePersona({ personaId, rol, tipo });
      return new Set(resultados.map(({ tmdbId }) => tmdbId));
    }),
  );

  const resultados = respuesta.resultados.filter(
    (item) => tieneGenero(item, generoIds) && creditos.every((ids) => ids.has(item.tmdbId)),
  );

  return { ...respuesta, resultados };
}

function crearRespuestaVacia(tipo, pagina) {
  return {
    resultados: [],
    pagina,
    totalResultados: 0,
    totalPaginas: 0,
    tipo,
  };
}

async function buscarSinTextoConPersonas(filtros, tipo, generoIds) {
  const personas = personasDeFiltros(filtros);
  const creditosPorPersona = await Promise.all(
    personas.map((persona) => obtenerCreditosDePersona({ ...persona, tipo })),
  );
  const idsRequeridos = creditosPorPersona
    .slice(1)
    .map((creditos) => new Set(creditos.map(({ tmdbId }) => tmdbId)));
  const titulos = new Map();

  for (const credito of creditosPorPersona[0]) {
    if (idsRequeridos.some((ids) => !ids.has(credito.tmdbId))) {
      continue;
    }
    if (
      (filtros.anio !== undefined && obtenerAnio(credito.fecha) !== filtros.anio) ||
      !tieneGenero(credito, generoIds)
    ) {
      continue;
    }
    titulos.set(credito.tmdbId, credito);
  }

  const resultadosOrdenados = [...titulos.values()].sort((a, b) => b.relevancia - a.relevancia);
  const totalPaginas = Math.min(
    PAGINA_MAXIMA,
    Math.ceil(resultadosOrdenados.length / TMDB_CONFIG.RESULTADOS_POR_PAGINA),
  );
  const inicio = (filtros.pagina - 1) * TMDB_CONFIG.RESULTADOS_POR_PAGINA;

  return {
    resultados: resultadosOrdenados.slice(inicio, inicio + TMDB_CONFIG.RESULTADOS_POR_PAGINA),
    pagina: filtros.pagina,
    totalResultados: resultadosOrdenados.length,
    totalPaginas,
  };
}

async function buscarTipoPagina(filtros, tipo, pagina) {
  const generoIds = obtenerGeneroIds(filtros, tipo);
  if (generoIds?.length === 0) {
    return crearRespuestaVacia(tipo, pagina);
  }

  if (!filtros.q.trim() && personasDeFiltros(filtros).length > 0) {
    return buscarSinTextoConPersonas({ ...filtros, pagina }, tipo, generoIds);
  }

  const respuestaExterna = filtros.q.trim()
    ? await tmdbIntegration.buscarTitulosPorTexto({
        tipo,
        q: filtros.q,
        anio: filtros.anio,
        pagina,
      })
    : await tmdbIntegration.descubrirTitulos({
        tipo,
        anio: filtros.anio,
        generoIds,
        pagina,
      });

  return normalizarRespuestaFiltrada(respuestaExterna, tipo, filtros, generoIds);
}

async function buscarPagina(filtros) {
  const tipos = filtros.tipo ? [filtros.tipo] : TIPOS_BUSQUEDA;
  const respuestas = await Promise.all(
    tipos.map((tipo) => buscarTipoPagina(filtros, tipo, filtros.pagina)),
  );
  const resultados = respuestas
    .flatMap((respuesta) => respuesta.resultados)
    .sort((a, b) => b.relevancia - a.relevancia)
    .map(({ relevancia: _relevancia, generoIds: _generoIds, fecha: _fecha, ...resultado }) =>
      Object.fromEntries(Object.entries(resultado).filter(([clave]) => clave !== 'puesto')),
    );

  return validateExternalResponse(respuestaBusquedaSchema, {
    resultados,
    pagina: filtros.pagina,
    totalResultados: respuestas.reduce((total, respuesta) => total + respuesta.totalResultados, 0),
    totalPaginas: Math.max(...respuestas.map((respuesta) => respuesta.totalPaginas)),
  });
}

export async function buscarTitulos(filtros, { avanzarSiVacio = true } = {}) {
  const hayFiltrosAvanzados = tieneFiltrosAvanzados(filtros);
  const ultimaPagina =
    hayFiltrosAvanzados && avanzarSiVacio
      ? Math.min(PAGINA_MAXIMA, filtros.pagina + TMDB_CONFIG.MAX_PAGINAS_BUSQUEDA_FILTRADA - 1)
      : filtros.pagina;
  let respuesta;

  for (let pagina = filtros.pagina; pagina <= ultimaPagina; pagina += 1) {
    respuesta = await buscarPagina({ ...filtros, pagina });
    if (
      !hayFiltrosAvanzados ||
      respuesta.resultados.length > 0 ||
      pagina >= respuesta.totalPaginas
    ) {
      return respuesta;
    }
  }

  return respuesta;
}

export async function listarGeneros() {
  const [generosPelicula, generosSerie] = await Promise.all([
    tmdbIntegration.listarGenerosPorTipo(TIPO_TITULO.PELICULA),
    tmdbIntegration.listarGenerosPorTipo(TIPO_TITULO.SERIE),
  ]);
  const generosDisponibles = new Map([
    [TIPO_TITULO.PELICULA, validateExternalResponse(z.array(generoSchema), generosPelicula)],
    [TIPO_TITULO.SERIE, validateExternalResponse(z.array(generoSchema), generosSerie)],
  ]);

  return GENEROS_BUSQUEDA.filter((genero) =>
    Object.entries(genero.tmdbIds).some(([tipo, ids]) => {
      const idsDisponibles = new Set(generosDisponibles.get(tipo).map(({ id }) => id));
      return ids.some((id) => idsDisponibles.has(id));
    }),
  )
    .map(({ id, nombre }) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function tieneCreditoDeRol(creditos, rol) {
  return esCreditoDeRol(creditos, rol).length > 0;
}

async function verificarRolPersona(personaId, rol) {
  const creditos = validateExternalResponse(
    respuestaCreditosCombinadosSchema,
    await tmdbIntegration.obtenerCreditosCombinados({ personaId }),
  );
  return tieneCreditoDeRol(creditos, rol);
}

export async function buscarPersonas({ q, rol }) {
  const departamento = rol === ROL_PERSONA.ACTOR ? 'acting' : 'directing';
  const personas = [];
  const idsIncluidos = new Set();
  let personasSecundariasValidadas = 0;
  let totalPaginas = 1;

  for (
    let pagina = 1;
    pagina <= Math.min(totalPaginas, TMDB_CONFIG.MAX_PAGINAS_BUSQUEDA_PERSONAS) &&
    personas.length < TMDB_CONFIG.MAX_PERSONAS_SUGERIDAS;
    pagina += 1
  ) {
    const respuesta = validateExternalResponse(
      respuestaPersonasSchema,
      await tmdbIntegration.buscarPersonas({ q, pagina }),
    );
    totalPaginas = respuesta.totalPaginas;

    const candidatasPrincipales = respuesta.resultados.filter(
      (persona) => persona.departamentoConocido?.toLocaleLowerCase('en') === departamento,
    );
    const idsPrincipalesNuevos = new Set(
      candidatasPrincipales.map(({ id }) => id).filter((id) => !idsIncluidos.has(id)),
    );
    const candidatasSecundarias = respuesta.resultados.filter(
      (persona) => !candidatasPrincipales.includes(persona) && !idsIncluidos.has(persona.id),
    );
    const cuposRestantes = Math.max(
      0,
      TMDB_CONFIG.MAX_PERSONAS_SUGERIDAS - personas.length - idsPrincipalesNuevos.size,
    );
    const cantidadAValidar = Math.min(
      cuposRestantes === 0 ? 0 : candidatasSecundarias.length,
      TMDB_CONFIG.MAX_PERSONAS_SECUNDARIAS_A_VALIDAR - personasSecundariasValidadas,
    );
    const validadasSecundarias = new Set();

    for (
      let inicio = 0;
      inicio < cantidadAValidar;
      inicio += TMDB_CONFIG.TAMANIO_LOTE_CREDITOS_PERSONAS
    ) {
      const lote = candidatasSecundarias.slice(
        inicio,
        Math.min(inicio + TMDB_CONFIG.TAMANIO_LOTE_CREDITOS_PERSONAS, cantidadAValidar),
      );
      const elegibles = await Promise.all(
        lote.map(async ({ id }) => ((await verificarRolPersona(id, rol)) ? id : null)),
      );
      elegibles.filter((id) => id !== null).forEach((id) => validadasSecundarias.add(id));
      personasSecundariasValidadas += lote.length;

      if (validadasSecundarias.size >= cuposRestantes) {
        break;
      }
    }

    for (const persona of respuesta.resultados) {
      const esDelRolBuscado =
        candidatasPrincipales.includes(persona) || validadasSecundarias.has(persona.id);
      if (!esDelRolBuscado || idsIncluidos.has(persona.id)) {
        continue;
      }

      idsIncluidos.add(persona.id);
      personas.push({ id: persona.id, nombre: persona.nombre, fotoUrl: persona.fotoUrl });

      if (personas.length >= TMDB_CONFIG.MAX_PERSONAS_SUGERIDAS) {
        break;
      }
    }
  }

  return personas;
}

export async function obtenerPersona({ id, rol }) {
  const persona = validateExternalResponse(
    personaSchema,
    await tmdbIntegration.obtenerPersona({ personaId: id }),
  );

  if (!(await verificarRolPersona(id, rol))) {
    throw new NotFoundError('No se encontró una persona con ese rol');
  }

  return { id: persona.id, nombre: persona.nombre, fotoUrl: persona.fotoUrl };
}
