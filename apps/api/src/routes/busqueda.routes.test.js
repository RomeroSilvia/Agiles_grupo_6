import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { GENEROS_BUSQUEDA, TIPO_TITULO } from '@buscador/shared/constants';
import { createApp } from '../app.js';
import * as tmdbIntegration from '../integrations/tmdb.integration.js';

vi.mock('../integrations/tmdb.integration.js', () => ({
  buscarTitulosPorTexto: vi.fn(),
  descubrirTitulos: vi.fn(),
  obtenerCreditosPersona: vi.fn(),
  obtenerCreditosCombinados: vi.fn(),
  buscarPersonas: vi.fn(),
  obtenerPersona: vi.fn(),
  listarGenerosPorTipo: vi.fn(),
}));

const pelicula = {
  tmdbId: 1,
  tipo: TIPO_TITULO.PELICULA,
  nombre: 'Dune',
  anio: 2021,
  posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
  puntuacion: 8.1,
  relevancia: 100,
  generoIds: [18],
  fecha: '2021-10-22',
};

const persona = {
  id: 6193,
  nombre: 'Leonardo DiCaprio',
  fotoUrl: null,
  departamentoConocido: 'Acting',
};

function respuestaBusqueda(resultados = [pelicula], tipo = TIPO_TITULO.PELICULA) {
  return {
    resultados: resultados.map((resultado) => ({ ...resultado, tipo })),
    pagina: 1,
    totalResultados: resultados.length,
    totalPaginas: resultados.length ? 1 : 0,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  tmdbIntegration.buscarTitulosPorTexto.mockResolvedValue(respuestaBusqueda());
  tmdbIntegration.descubrirTitulos.mockImplementation(async ({ tipo }) =>
    respuestaBusqueda([{ ...pelicula, tipo }], tipo),
  );
  tmdbIntegration.obtenerCreditosPersona.mockResolvedValue({
    cast: [pelicula],
    crew: [{ ...pelicula, puesto: 'Director' }],
  });
  tmdbIntegration.obtenerCreditosCombinados.mockResolvedValue({
    cast: [{ id: pelicula.tmdbId }],
    crew: [{ id: pelicula.tmdbId, job: 'Director' }],
  });
  tmdbIntegration.buscarPersonas.mockResolvedValue({ resultados: [persona], totalPaginas: 1 });
  tmdbIntegration.obtenerPersona.mockResolvedValue(persona);
  tmdbIntegration.listarGenerosPorTipo.mockImplementation(async (tipo) => {
    const generoDrama = GENEROS_BUSQUEDA.find(({ id }) => id === 'drama');
    return [{ id: generoDrama.tmdbIds[tipo][0], nombre: 'Drama' }];
  });
});

describe('GET /api/busqueda', () => {
  it('busca y valida títulos por tipo y año', async () => {
    const response = await request(createApp()).get('/api/busqueda').query({
      q: 'dune',
      tipo: 'pelicula',
      anio: '2021',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.resultados).toEqual([
      {
        tmdbId: 1,
        tipo: 'pelicula',
        nombre: 'Dune',
        anio: 2021,
        posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
        puntuacion: 8.1,
      },
    ]);
    expect(tmdbIntegration.buscarTitulosPorTexto).toHaveBeenCalledWith({
      tipo: 'pelicula',
      q: 'dune',
      anio: 2021,
      pagina: 1,
    });
  });

  it('envía al proveedor los géneros unificados sin título', async () => {
    const response = await request(createApp()).get('/api/busqueda').query({ genero: 'drama' });

    expect(response.status).toBe(200);
    expect(tmdbIntegration.descubrirTitulos).toHaveBeenCalledWith({
      tipo: 'pelicula',
      anio: undefined,
      generoIds: [18],
      pagina: 1,
    });
    expect(tmdbIntegration.descubrirTitulos).toHaveBeenCalledWith({
      tipo: 'serie',
      anio: undefined,
      generoIds: [18],
      pagina: 1,
    });
  });

  it('rechaza una búsqueda vacía, géneros TMDB sueltos y parámetros desconocidos', async () => {
    const sinFiltros = await request(createApp()).get('/api/busqueda');
    const generoTmdb = await request(createApp()).get('/api/busqueda').query({ genero: '18' });
    const nombreEnUrl = await request(createApp())
      .get('/api/busqueda')
      .query({ q: 'dune', actorNombre: 'Leonardo DiCaprio' });

    expect(sinFiltros.status).toBe(400);
    expect(generoTmdb.status).toBe(400);
    expect(nombreEnUrl.status).toBe(400);
    expect(tmdbIntegration.buscarTitulosPorTexto).not.toHaveBeenCalled();
  });

  it('responde 502 ante una respuesta de TMDB que no cumple el model', async () => {
    tmdbIntegration.buscarTitulosPorTexto.mockResolvedValueOnce({
      resultados: [{ ...pelicula, tmdbId: 'incorrecto' }],
      pagina: 1,
      totalResultados: 1,
      totalPaginas: 1,
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(createApp())
      .get('/api/busqueda')
      .query({ q: 'dune', tipo: 'pelicula' });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('EXTERNAL_SERVICE');
    consoleError.mockRestore();
  });
});

describe('opciones de filtros de búsqueda', () => {
  it('devuelve géneros unificados y legibles en español', async () => {
    const response = await request(createApp()).get('/api/busqueda/generos');

    expect(response.status).toBe(200);
    expect(response.body.data).toContainEqual({ id: 'drama', nombre: 'Drama' });
    expect(tmdbIntegration.listarGenerosPorTipo).toHaveBeenCalledWith('pelicula');
    expect(tmdbIntegration.listarGenerosPorTipo).toHaveBeenCalledWith('serie');
  });

  it('busca y valida personas por nombre y rol', async () => {
    const response = await request(createApp()).get('/api/busqueda/personas').query({
      q: 'Leo',
      rol: 'actor',
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: 6193, nombre: 'Leonardo DiCaprio', fotoUrl: null }]);
    expect(tmdbIntegration.buscarPersonas).toHaveBeenCalledWith({ q: 'Leo', pagina: 1 });
  });

  it('resuelve el nombre desde el ID de la persona y comprueba el rol', async () => {
    const response = await request(createApp()).get('/api/busqueda/personas/6193').query({
      rol: 'actor',
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: 6193, nombre: 'Leonardo DiCaprio', fotoUrl: null });
    expect(tmdbIntegration.obtenerPersona).toHaveBeenCalledWith({ personaId: 6193 });
    expect(tmdbIntegration.obtenerCreditosCombinados).toHaveBeenCalledWith({ personaId: 6193 });
  });

  it('valida el largo, el rol y los parámetros de la búsqueda de personas', async () => {
    const response = await request(createApp()).get('/api/busqueda/personas').query({
      q: 'L',
      rol: 'guionista',
      extra: 'no permitido',
    });

    expect(response.status).toBe(400);
    expect(tmdbIntegration.buscarPersonas).not.toHaveBeenCalled();
  });
});
