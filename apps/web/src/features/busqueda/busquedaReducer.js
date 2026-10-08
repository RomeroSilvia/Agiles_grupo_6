export const FILTROS_INICIALES = Object.freeze({
  q: '',
  tipo: '',
  anio: '',
  soloPropias: false,
});

const RESULTADOS_VACIOS = Object.freeze({
  resultados: [],
  pagina: 1,
  totalResultados: 0,
  totalPaginas: 0,
  verificacionIncompleta: false,
});

export const ACCIONES_BUSQUEDA = Object.freeze({
  FILTROS_ACTUALIZADOS: 'FILTROS_ACTUALIZADOS',
  BUSQUEDA_INVALIDA: 'BUSQUEDA_INVALIDA',
  BUSQUEDA_INICIADA: 'BUSQUEDA_INICIADA',
  BUSQUEDA_EXITOSA: 'BUSQUEDA_EXITOSA',
  BUSQUEDA_FALLIDA: 'BUSQUEDA_FALLIDA',
});

function textoGuardado(valor) {
  return typeof valor === 'string' ? valor : '';
}

function enteroGuardado(valor, porDefecto) {
  return Number.isInteger(valor) ? valor : porDefecto;
}

function totalGuardado(valor) {
  return enteroGuardado(valor, 0);
}

export function obtenerEstadoInicial(estadoGuardado) {
  const base = {
    filtros: FILTROS_INICIALES,
    ...RESULTADOS_VACIOS,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasSearched: false,
    ultimaBusqueda: null,
  };

  if (!estadoGuardado || typeof estadoGuardado !== 'object') {
    return base;
  }

  const filtrosGuardados = estadoGuardado.filtros;

  return {
    ...base,
    filtros: {
      q: textoGuardado(filtrosGuardados?.q),
      tipo: textoGuardado(filtrosGuardados?.tipo),
      anio: textoGuardado(filtrosGuardados?.anio),
      soloPropias: Boolean(filtrosGuardados?.soloPropias),
    },
    resultados: Array.isArray(estadoGuardado.resultados) ? estadoGuardado.resultados : [],
    pagina: enteroGuardado(estadoGuardado.pagina, 1),
    totalResultados: totalGuardado(estadoGuardado.totalResultados),
    totalPaginas: totalGuardado(estadoGuardado.totalPaginas),
    verificacionIncompleta: Boolean(estadoGuardado.verificacionIncompleta),
    hasSearched: Boolean(estadoGuardado.hasSearched),
    ultimaBusqueda:
      estadoGuardado.ultimaBusqueda && typeof estadoGuardado.ultimaBusqueda === 'object'
        ? estadoGuardado.ultimaBusqueda
        : null,
  };
}

export function prepararFiltros(filtrosConsulta, pagina) {
  return {
    q: filtrosConsulta.q?.trim() ?? '',
    tipo: filtrosConsulta.tipo || undefined,
    anio: filtrosConsulta.anio || undefined,
    pagina,
  };
}

export function convertirFiltros(filtrosValidos) {
  return {
    q: filtrosValidos.q,
    tipo: filtrosValidos.tipo ?? '',
    anio: filtrosValidos.anio === undefined ? '' : String(filtrosValidos.anio),
  };
}

function sinCarga(estado, acumular) {
  return acumular ? { ...estado, isLoadingMore: false } : { ...estado, isLoading: false };
}

export function busquedaReducer(estado, accion) {
  switch (accion.type) {
    case ACCIONES_BUSQUEDA.FILTROS_ACTUALIZADOS:
      return { ...estado, filtros: accion.filtros };

    case ACCIONES_BUSQUEDA.BUSQUEDA_INVALIDA:
      return {
        ...estado,
        ...(accion.acumular ? {} : { ...RESULTADOS_VACIOS, ultimaBusqueda: null }),
        hasSearched: true,
        error: accion.mensaje,
        isLoading: false,
        isLoadingMore: false,
      };

    case ACCIONES_BUSQUEDA.BUSQUEDA_INICIADA:
      return {
        ...estado,
        ...(accion.acumular
          ? { isLoadingMore: true }
          : { ...RESULTADOS_VACIOS, isLoading: true, isLoadingMore: false }),
        hasSearched: true,
        error: null,
        ultimaBusqueda: accion.ultimaBusqueda,
      };

    case ACCIONES_BUSQUEDA.BUSQUEDA_EXITOSA:
      return sinCarga(
        {
          ...estado,
          resultados: accion.acumular
            ? [...estado.resultados, ...accion.data.resultados]
            : accion.data.resultados,
          pagina: accion.data.pagina,
          totalResultados: accion.data.totalResultados,
          totalPaginas: accion.data.totalPaginas,
          verificacionIncompleta:
            (accion.acumular && estado.verificacionIncompleta) ||
            Boolean(accion.data.verificacionIncompleta),
        },
        accion.acumular,
      );

    case ACCIONES_BUSQUEDA.BUSQUEDA_FALLIDA:
      return sinCarga(
        {
          ...estado,
          ...(accion.acumular ? {} : RESULTADOS_VACIOS),
          error: accion.mensaje,
        },
        accion.acumular,
      );

    default:
      return estado;
  }
}
