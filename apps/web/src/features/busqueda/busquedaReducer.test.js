import { describe, it, expect } from 'vitest';
import {
  ACCIONES_BUSQUEDA,
  FILTROS_INICIALES,
  busquedaReducer,
  convertirFiltros,
  obtenerEstadoInicial,
  prepararFiltros,
  validarFiltros,
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

  it('recupera solo los filtros guardados', () => {
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
      genero: '',
      actor: '',
      actorNombre: '',
      director: '',
      directorNombre: '',
      soloPropias: false,
    });
    expect(estado.resultados).toEqual([]);
    expect(estado.pagina).toBe(1);
    expect(estado.totalPaginas).toBe(0);
    expect(estado.hasSearched).toBe(false);
    expect(estado.ultimaBusqueda).toBeNull();
    expect(estado.verificacionIncompleta).toBe(false);
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
      genero: undefined,
      actor: undefined,
      director: undefined,
      pagina: 1,
    });
  });

  it('vuelve a texto los filtros validados para el formulario', () => {
    expect(convertirFiltros({ q: 'Dune', anio: 2021, pagina: 1 })).toEqual({
      q: 'Dune',
      tipo: '',
      anio: '2021',
      genero: '',
      actor: '',
      director: '',
    });
  });

  it('valida los filtros preparados con la página indicada', () => {
    expect(validarFiltros({ q: ' Dune ', tipo: '', anio: '' }, '2').data).toEqual({
      q: 'Dune',
      tipo: undefined,
      anio: undefined,
      genero: undefined,
      actor: undefined,
      director: undefined,
      pagina: 2,
    });
  });

  it('valida los identificadores opcionales de filtros avanzados', () => {
    expect(
      validarFiltros({ q: 'Dune', genero: 'drama', actor: '6193', director: '525' }).data,
    ).toEqual({
      q: 'Dune',
      tipo: undefined,
      anio: undefined,
      genero: 'drama',
      actor: 6193,
      director: 525,
      pagina: 1,
    });
    expect(validarFiltros({ q: 'Dune', actor: 'invalido' }).success).toBe(false);
  });

  it('permite buscar sin texto cuando hay otro filtro seleccionado', () => {
    expect(validarFiltros({ q: '', genero: 'drama' }).data).toMatchObject({
      q: '',
      genero: 'drama',
    });
    expect(validarFiltros({ q: '', soloPropias: true }).data.q).toBe('');
    expect(validarFiltros({ q: '' }).success).toBe(false);
  });
});

describe('busquedaReducer', () => {
  it('reinicia los filtros, los resultados y el estado de búsqueda', () => {
    const estado = busquedaReducer(
      {
        ...estadoConResultados(),
        filtros: { q: 'Dune', tipo: 'pelicula', anio: '2021', soloPropias: true },
        isLoading: true,
        error: 'Error anterior',
      },
      { type: ACCIONES_BUSQUEDA.BUSQUEDA_REINICIADA },
    );

    expect(estado.filtros).toEqual(FILTROS_INICIALES);
    expect(estado.resultados).toEqual([]);
    expect(estado.totalResultados).toBe(0);
    expect(estado.totalPaginas).toBe(0);
    expect(estado.isLoading).toBe(false);
    expect(estado.error).toBeNull();
    expect(estado.hasSearched).toBe(false);
    expect(estado.ultimaBusqueda).toBeNull();
  });

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

  it('cargar más conserva el aviso de verificación incompleta de las páginas anteriores', () => {
    const estado = busquedaReducer(
      { ...estadoConResultados(), verificacionIncompleta: true, isLoadingMore: true },
      {
        type: ACCIONES_BUSQUEDA.BUSQUEDA_EXITOSA,
        data: {
          resultados: [MATRIX],
          pagina: 2,
          totalResultados: 2,
          totalPaginas: 2,
          verificacionIncompleta: false,
        },
        acumular: true,
      },
    );

    expect(estado.verificacionIncompleta).toBe(true);
  });

  it('una búsqueda nueva reemplaza el aviso de verificación incompleta', () => {
    const estado = busquedaReducer(
      { ...estadoConResultados(), verificacionIncompleta: true, isLoading: true },
      {
        type: ACCIONES_BUSQUEDA.BUSQUEDA_EXITOSA,
        data: { resultados: [MATRIX], pagina: 1, totalResultados: 1, totalPaginas: 1 },
        acumular: false,
      },
    );

    expect(estado.verificacionIncompleta).toBe(false);
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
