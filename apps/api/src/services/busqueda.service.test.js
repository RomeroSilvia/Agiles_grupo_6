import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GENEROS_BUSQUEDA, TIPO_TITULO } from '@buscador/shared/constants';
import { ExternalServiceError } from '../errors/index.js';

vi.mock('../integrations/tmdb.integration.js', () => ({
  buscarTitulosPorTexto: vi.fn(),
  descubrirTitulos: vi.fn(),
  obtenerCreditosPersona: vi.fn(),
  obtenerCreditosCombinados: vi.fn(),
  buscarPersonas: vi.fn(),
  obtenerPersona: vi.fn(),
  listarGenerosPorTipo: vi.fn(),
}));

import * as tmdbIntegration from '../integrations/tmdb.integration.js';
import * as busquedaService from './busqueda.service.js';

function titulo({ tmdbId, tipo = TIPO_TITULO.PELICULA, generoIds = [18], fecha = '2021-01-01' }) {
  return {
    tmdbId,
    tipo,
    nombre: `Título ${tmdbId}`,
    posterUrl: null,
    anio: Number(fecha.slice(0, 4)),
    puntuacion: 7,
    relevancia: tmdbId,
    generoIds,
    fecha,
  };
}

function respuesta(resultados, totalPaginas = resultados.length ? 1 : 0) {
  return {
    resultados,
    pagina: 1,
    totalResultados: resultados.length,
    totalPaginas,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  tmdbIntegration.buscarTitulosPorTexto.mockImplementation(async ({ tipo }) =>
    respuesta([titulo({ tmdbId: 1, tipo })]),
  );
  tmdbIntegration.descubrirTitulos.mockImplementation(async ({ tipo }) =>
    respuesta([titulo({ tmdbId: tipo === TIPO_TITULO.PELICULA ? 1 : 2, tipo })]),
  );
  tmdbIntegration.obtenerCreditosPersona.mockResolvedValue({
    cast: [titulo({ tmdbId: 1 })],
    crew: [{ ...titulo({ tmdbId: 1 }), puesto: 'Director' }],
  });
  tmdbIntegration.obtenerCreditosCombinados.mockResolvedValue({
    cast: [{ id: 1 }],
    crew: [{ id: 1, job: 'Director' }],
  });
  tmdbIntegration.buscarPersonas.mockResolvedValue({
    resultados: [
      {
        id: 6193,
        nombre: 'Leonardo DiCaprio',
        fotoUrl: null,
        departamentoConocido: 'Acting',
      },
    ],
    totalPaginas: 1,
  });
  tmdbIntegration.obtenerPersona.mockResolvedValue({
    id: 6193,
    nombre: 'Leonardo DiCaprio',
    fotoUrl: null,
    departamentoConocido: 'Acting',
  });
  tmdbIntegration.listarGenerosPorTipo.mockImplementation(async (tipo) => {
    const ids = new Set(GENEROS_BUSQUEDA.flatMap((genero) => genero.tmdbIds[tipo]));
    return [...ids].map((id) => ({ id, nombre: `Género ${id}` }));
  });
});

describe('busqueda.service', () => {
  it('mapea un género unificado a los IDs de TMDB correspondientes por tipo', async () => {
    tmdbIntegration.descubrirTitulos.mockImplementation(async ({ tipo }) =>
      respuesta([
        tipo === TIPO_TITULO.PELICULA
          ? titulo({ tmdbId: 1, tipo, generoIds: [28] })
          : titulo({ tmdbId: 2, tipo, generoIds: [10759] }),
      ]),
    );

    const resultados = await busquedaService.buscarTitulos({
      q: '',
      genero: 'accion-aventura',
      pagina: 1,
    });

    expect(tmdbIntegration.descubrirTitulos).toHaveBeenCalledWith({
      tipo: TIPO_TITULO.PELICULA,
      anio: undefined,
      generoIds: [28, 12],
      pagina: 1,
    });
    expect(tmdbIntegration.descubrirTitulos).toHaveBeenCalledWith({
      tipo: TIPO_TITULO.SERIE,
      anio: undefined,
      generoIds: [10759],
      pagina: 1,
    });
    expect(resultados.resultados.map(({ tmdbId }) => tmdbId)).toEqual([2, 1]);
  });

  it('no busca cuando el género no existe para el tipo elegido', async () => {
    const resultados = await busquedaService.buscarTitulos({
      q: '',
      tipo: TIPO_TITULO.SERIE,
      genero: 'historia',
      pagina: 1,
    });

    expect(resultados.resultados).toEqual([]);
    expect(tmdbIntegration.descubrirTitulos).not.toHaveBeenCalled();
  });

  it('cruza género, actor y director en el servicio de búsqueda', async () => {
    const candidata = titulo({ tmdbId: 1, generoIds: [18] });
    tmdbIntegration.buscarTitulosPorTexto.mockResolvedValueOnce(
      respuesta([
        candidata,
        titulo({ tmdbId: 2, generoIds: [28] }),
        titulo({ tmdbId: 3, generoIds: [18] }),
      ]),
    );
    tmdbIntegration.obtenerCreditosPersona
      .mockResolvedValueOnce({
        cast: [candidata, titulo({ tmdbId: 2, generoIds: [28] }), titulo({ tmdbId: 3 })],
        crew: [],
      })
      .mockResolvedValueOnce({
        cast: [],
        crew: [
          { ...candidata, puesto: 'Director' },
          { ...titulo({ tmdbId: 3 }), puesto: 'Guionista' },
        ],
      });

    const resultados = await busquedaService.buscarTitulos({
      q: 'película',
      tipo: TIPO_TITULO.PELICULA,
      genero: 'drama',
      actor: 6193,
      director: 525,
      pagina: 1,
    });

    expect(resultados.resultados.map(({ tmdbId }) => tmdbId)).toEqual([1]);
    expect(tmdbIntegration.obtenerCreditosPersona).toHaveBeenNthCalledWith(1, {
      personaId: 6193,
      tipo: TIPO_TITULO.PELICULA,
    });
    expect(tmdbIntegration.obtenerCreditosPersona).toHaveBeenNthCalledWith(2, {
      personaId: 525,
      tipo: TIPO_TITULO.PELICULA,
    });
  });

  it('devuelve solo los géneros unificados que valida contra TMDB', async () => {
    tmdbIntegration.listarGenerosPorTipo.mockImplementation(async (tipo) =>
      tipo === TIPO_TITULO.PELICULA
        ? [
            { id: 18, nombre: 'Drama' },
            { id: 28, nombre: 'Action' },
          ]
        : [
            { id: 18, nombre: 'Drama' },
            { id: 10759, nombre: 'Action & Adventure' },
          ],
    );

    const generos = await busquedaService.listarGeneros();

    expect(generos).toContainEqual({ id: 'accion-aventura', nombre: 'Acción y aventura' });
    expect(generos).toContainEqual({ id: 'drama', nombre: 'Drama' });
    expect(generos).not.toContainEqual(expect.objectContaining({ nombre: 'Action & Adventure' }));
  });

  it('valida las respuestas de géneros y personas con sus models', async () => {
    tmdbIntegration.listarGenerosPorTipo.mockResolvedValueOnce([{ id: '18', nombre: 'Drama' }]);
    await expect(busquedaService.listarGeneros()).rejects.toBeInstanceOf(ExternalServiceError);

    tmdbIntegration.buscarPersonas.mockResolvedValueOnce({
      resultados: [{ id: '6193', nombre: 'Leonardo', fotoUrl: null }],
      totalPaginas: 1,
    });
    await expect(busquedaService.buscarPersonas({ q: 'Leo', rol: 'actor' })).rejects.toBeInstanceOf(
      ExternalServiceError,
    );
  });

  it('incluye personas secundarias si los créditos confirman el rol', async () => {
    tmdbIntegration.buscarPersonas.mockImplementation(async ({ pagina }) => ({
      resultados:
        pagina === 1
          ? [
              {
                id: 10,
                nombre: 'Actriz principal',
                fotoUrl: null,
                departamentoConocido: 'Acting',
              },
              {
                id: 11,
                nombre: 'Actor secundario',
                fotoUrl: null,
                departamentoConocido: 'Directing',
              },
            ]
          : [
              {
                id: 12,
                nombre: 'Otra actriz',
                fotoUrl: null,
                departamentoConocido: 'Acting',
              },
            ],
      totalPaginas: 5,
    }));
    tmdbIntegration.obtenerCreditosCombinados.mockImplementation(async ({ personaId }) => ({
      cast: personaId === 11 ? [{ id: 901 }] : [],
      crew: [],
    }));

    const personas = await busquedaService.buscarPersonas({ q: 'actores', rol: 'actor' });

    expect(personas.map(({ id }) => id)).toEqual([10, 11, 12]);
    expect(
      tmdbIntegration.buscarPersonas.mock.calls.map(([parametros]) => parametros.pagina),
    ).toEqual([1, 2]);
    expect(tmdbIntegration.obtenerCreditosCombinados).toHaveBeenCalledOnce();
  });

  it('rechaza la resolución de una persona que no tiene el rol indicado', async () => {
    tmdbIntegration.obtenerCreditosCombinados.mockResolvedValueOnce({ cast: [], crew: [] });

    await expect(busquedaService.obtenerPersona({ id: 6193, rol: 'actor' })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});
