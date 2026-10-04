import { describe, it, expect } from 'vitest';
import {
  ACCIONES_BUSQUEDA,
  FILTROS_INICIALES,
  busquedaReducer,
  convertirFiltros,
  obtenerEstadoInicial,
  prepararFiltros,
} from './busquedaReducer.js';

const DUNE = { tmdbId: 1, tipo: 'pelicula', nombre: 'Dune' };
const MATRIX = { tmdbId: 2, tipo: 'pelicula', nombre: 'Matrix' };
const ULTIMA_BUSQUEDA = { q: 'Dune', tipo: '', anio: '' };

function estadoConResultados() {
  return {
    ...obtenerEstadoInicial(),
    resultados: [DUNE],
    pagina: 1,
    totalResultados: 2,
    totalPaginas: 2,
    hasSearched: true,
    ultimaBusqueda: ULTIMA_BUSQUEDA,
  };
}

describe('obtenerEstadoInicial', () => {
  it('arranca vacío si no hay estado guardado', () => {
    const estado = obtenerEstadoInicial(undefined);

    expect(estado.filtros).toEqual(FILTROS_INICIALES);
    expect(estado.resultados).toEqual([]);
    expect(estado.hasSearched).toBe(false);
    expect(estado.isLoading).toBe(false);
  });

  it('recupera el estado guardado al volver del detalle', () => {
    const estado = obtenerEstadoInicial({
      filtros: { q: 'Dune', tipo: 'pelicula', anio: '2021' },
      resultados: [DUNE],
      pagina: 2,
      totalResultados: 30,
      totalPaginas: 3,
      hasSearched: true,
      ultimaBusqueda: ULTIMA_BUSQUEDA,
    });

    expect(estado.filtros).toEqual({
      q: 'Dune',
      tipo: 'pelicula',
      anio: '2021',
      soloPropias: false,
    });
    expect(estado.resultados).toEqual([DUNE]);
    expect(estado.pagina).toBe(2);
    expect(estado.ultimaBusqueda).toEqual(ULTIMA_BUSQUEDA);
  });

  it('descarta valores guardados con un formato inválido', () => {
    const estado = obtenerEstadoInicial({
      filtros: { q: 5, tipo: null },
      resultados: 'no es una lista',
      pagina: 'dos',
      ultimaBusqueda: 'Dune',
    });

    expect(estado.filtros).toEqual(FILTROS_INICIALES);
    expect(estado.resultados).toEqual([]);
    expect(estado.pagina).toBe(1);
    expect(estado.ultimaBusqueda).toBeNull();
  });
});

describe('prepararFiltros y convertirFiltros', () => {
  it('limpia los filtros vacíos antes de validar', () => {
    expect(prepararFiltros({ q: '  Dune ', tipo: '', anio: '' }, 1)).toEqual({
      q: 'Dune',
      tipo: undefined,
      anio: undefined,
      pagina: 1,
    });
  });

  it('vuelve a texto los filtros validados para el formulario', () => {
    expect(convertirFiltros({ q: 'Dune', anio: 2021, pagina: 1 })).toEqual({
      q: 'Dune',
      tipo: '',
      anio: '2021',
    });
  });
});

describe('busquedaReducer', () => {
  it('una búsqueda nueva vacía los resultados y marca la carga', () => {
    const estado = busquedaReducer(estadoConResultados(), {
      type: ACCIONES_BUSQUEDA.BUSQUEDA_INICIADA,
      ultimaBusqueda: { q: 'Matrix', tipo: '', anio: '' },
      acumular: false,
    });

    expect(estado.resultados).toEqual([]);
    expect(estado.isLoading).toBe(true);
    expect(estado.error).toBeNull();
    expect(estado.ultimaBusqueda.q).toBe('Matrix');
  });

  it('cargar más conserva los resultados y suma los nuevos', () => {
    const iniciada = busquedaReducer(estadoConResultados(), {
      type: ACCIONES_BUSQUEDA.BUSQUEDA_INICIADA,
      ultimaBusqueda: ULTIMA_BUSQUEDA,
      acumular: true,
    });

    expect(iniciada.resultados).toEqual([DUNE]);
    expect(iniciada.isLoadingMore).toBe(true);

    const exitosa = busquedaReducer(iniciada, {
      type: ACCIONES_BUSQUEDA.BUSQUEDA_EXITOSA,
      data: { resultados: [MATRIX], pagina: 2, totalResultados: 2, totalPaginas: 2 },
      acumular: true,
    });

    expect(exitosa.resultados).toEqual([DUNE, MATRIX]);
    expect(exitosa.pagina).toBe(2);
    expect(exitosa.isLoadingMore).toBe(false);
  });

  it('si falla al cargar más, conserva los resultados y guarda el error', () => {
    const estado = busquedaReducer(
      { ...estadoConResultados(), isLoadingMore: true },
      { type: ACCIONES_BUSQUEDA.BUSQUEDA_FALLIDA, mensaje: 'Sin conexión', acumular: true },
    );

    expect(estado.resultados).toEqual([DUNE]);
    expect(estado.error).toBe('Sin conexión');
    expect(estado.isLoadingMore).toBe(false);
  });

  it('si falla una búsqueda nueva, vacía los resultados', () => {
    const estado = busquedaReducer(
      { ...estadoConResultados(), isLoading: true },
      { type: ACCIONES_BUSQUEDA.BUSQUEDA_FALLIDA, mensaje: 'Sin conexión', acumular: false },
    );

    expect(estado.resultados).toEqual([]);
    expect(estado.error).toBe('Sin conexión');
    expect(estado.isLoading).toBe(false);
  });

  it('una búsqueda inválida olvida la última búsqueda y muestra el mensaje', () => {
    const estado = busquedaReducer(estadoConResultados(), {
      type: ACCIONES_BUSQUEDA.BUSQUEDA_INVALIDA,
      mensaje: 'Ingresá un título para buscar',
      acumular: false,
    });

    expect(estado.resultados).toEqual([]);
    expect(estado.ultimaBusqueda).toBeNull();
    expect(estado.error).toBe('Ingresá un título para buscar');
    expect(estado.hasSearched).toBe(true);
  });

  it('ignora acciones desconocidas', () => {
    const estado = estadoConResultados();

    expect(busquedaReducer(estado, { type: 'OTRA' })).toBe(estado);
  });
});
