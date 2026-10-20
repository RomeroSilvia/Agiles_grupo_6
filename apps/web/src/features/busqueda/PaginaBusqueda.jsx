import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ROL_PERSONA } from '@buscador/shared/constants';
import { tieneFiltrosAvanzados } from '@buscador/shared/schemas';
import { APP_NAME } from '../../config/app.config.js';
import { useBusqueda } from './useBusqueda.js';
import { FILTROS_INICIALES, convertirFiltros, validarFiltros } from './busquedaReducer.js';
import { useFiltroPlataformasPropias } from './useFiltroPlataformasPropias.js';
import { useGenerosBusqueda } from './useGenerosBusqueda.js';
import { FormularioBusqueda } from './FormularioBusqueda.jsx';
import { ResultadosBusqueda } from './ResultadosBusqueda.jsx';

function obtenerBusquedaInicial(searchParams) {
  const filtros = {
    q: searchParams.get('q') ?? '',
    tipo: searchParams.get('tipo') ?? '',
    anio: searchParams.get('anio') ?? '',
    genero: searchParams.get('genero') ?? '',
    actor: searchParams.get('actor') ?? '',
    director: searchParams.get('director') ?? '',
    actorNombre: '',
    directorNombre: '',
    soloPropias: searchParams.get('propias') === 'true',
  };
  const validacion = validarFiltros(filtros, searchParams.get('pagina') ?? 1);

  if (validacion.success) {
    Object.assign(filtros, convertirFiltros(validacion.data));
  }

  return {
    filtros,
    consulta: validacion.success ? validacion.data : null,
  };
}

function crearSearchParams({ q, tipo, anio, genero, actor, director, soloPropias }, pagina) {
  const params = new URLSearchParams();
  if (q.trim()) {
    params.set('q', q.trim());
  }
  if (tipo) {
    params.set('tipo', tipo);
  }
  if (anio) {
    params.set('anio', anio);
  }
  if (genero) {
    params.set('genero', genero);
  }
  if (actor) {
    params.set('actor', actor);
  }
  if (director) {
    params.set('director', director);
  }
  if (soloPropias) {
    params.set('propias', 'true');
  }
  params.set('pagina', String(pagina));
  return params;
}

function sinCriteriosBusqueda(filtros) {
  return !(
    filtros.q.trim() ||
    filtros.tipo ||
    filtros.anio ||
    filtros.genero ||
    filtros.actor ||
    filtros.director ||
    filtros.soloPropias
  );
}

export function PaginaBusqueda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [busquedaInicial] = useState(() => obtenerBusquedaInicial(searchParams));
  const {
    filtros,
    setFiltros,
    reiniciarBusqueda,
    buscar,
    buscarHastaPagina,
    buscarConFiltros,
    cargarMas,
    resultados,
    pagina,
    totalResultados,
    totalPaginas,
    verificacionIncompleta,
    isLoading,
    isLoadingMore,
    error,
    hasSearched,
    ultimaBusqueda,
  } = useBusqueda({ filtros: busquedaInicial.filtros });
  const filtroPropias = useFiltroPlataformasPropias();
  const generosBusqueda = useGenerosBusqueda({
    cargarInicialmente: Boolean(busquedaInicial.filtros.genero),
  });
  const busquedaInicialProcesadaRef = useRef(false);
  const busquedaInicialCanceladaRef = useRef(false);
  const limpiezaUrlPendienteRef = useRef(false);

  useEffect(() => {
    if (
      busquedaInicialProcesadaRef.current ||
      busquedaInicialCanceladaRef.current ||
      !busquedaInicial.consulta ||
      hasSearched ||
      (busquedaInicial.filtros.soloPropias && !filtroPropias.resuelto)
    ) {
      return;
    }

    busquedaInicialProcesadaRef.current = true;
    let completada = false;
    buscarHastaPagina(
      {
        ...busquedaInicial.filtros,
        soloPropias: busquedaInicial.filtros.soloPropias && filtroPropias.disponible,
        firmaPlataformas: filtroPropias.firma,
      },
      busquedaInicial.consulta.pagina,
    ).finally(() => {
      completada = true;
    });

    return () => {
      if (!completada && !busquedaInicialCanceladaRef.current) {
        busquedaInicialProcesadaRef.current = false;
      }
    };
  }, [
    buscarHastaPagina,
    busquedaInicial,
    hasSearched,
    filtroPropias.resuelto,
    filtroPropias.disponible,
    filtroPropias.firma,
  ]);

  useEffect(() => {
    if (limpiezaUrlPendienteRef.current) {
      limpiezaUrlPendienteRef.current = false;
      return;
    }

    if (!ultimaBusqueda || isLoading) {
      return;
    }

    const nextParams = crearSearchParams(ultimaBusqueda, pagina);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true, preventScrollReset: true });
    }
  }, [isLoading, ultimaBusqueda, pagina, searchParams, setSearchParams]);

  function conFiltroDisponible(filtrosConsulta) {
    return {
      ...filtrosConsulta,
      soloPropias: filtrosConsulta.soloPropias && filtroPropias.disponible,
      firmaPlataformas: filtroPropias.firma,
    };
  }

  function actualizarFiltro(nombre, valor) {
    const nextFiltros = { ...filtros, [nombre]: valor };
    setFiltros(nextFiltros);

    const filtrosParaValidar = {
      ...nextFiltros,
      q: ultimaBusqueda?.q ?? '',
    };

    if (hasSearched && nombre !== 'q') {
      if (validarFiltros(filtrosParaValidar).success) {
        buscarConFiltros(conFiltroDisponible(nextFiltros));
      } else if (sinCriteriosBusqueda(filtrosParaValidar)) {
        reiniciarBusquedaCompleta();
      }
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const titulo = filtros.q.trim();
    if (ultimaBusqueda && titulo && titulo !== ultimaBusqueda.q) {
      const filtrosReiniciados = { ...FILTROS_INICIALES, q: titulo };
      setFiltros(filtrosReiniciados);
      buscar(conFiltroDisponible(filtrosReiniciados));
      return;
    }

    buscar(conFiltroDisponible(filtros));
  }

  function handleChange(event) {
    actualizarFiltro(event.target.name, event.target.value);
  }

  function cambiarPersona(rol, persona, consulta = '') {
    const nombre = rol === ROL_PERSONA.ACTOR ? 'actorNombre' : 'directorNombre';
    const teniaSeleccion = Boolean(filtros[rol]);
    const nextFiltros = {
      ...filtros,
      [rol]: persona ? String(persona.id) : '',
      [nombre]: persona?.nombre ?? consulta,
    };
    setFiltros(nextFiltros);

    if (hasSearched && (persona || teniaSeleccion)) {
      const filtrosParaValidar = { ...nextFiltros, q: ultimaBusqueda?.q ?? '' };
      if (validarFiltros(filtrosParaValidar).success) {
        buscarConFiltros(conFiltroDisponible(nextFiltros));
      } else if (sinCriteriosBusqueda(filtrosParaValidar)) {
        reiniciarBusquedaCompleta();
      }
    }
  }

  function actualizarNombrePersona(rol, id, nombre) {
    const nombreCampo = `${rol}Nombre`;
    if (filtros[rol] !== String(id) || filtros[nombreCampo] === nombre) {
      return;
    }

    setFiltros({ ...filtros, [nombreCampo]: nombre });
  }

  function reiniciarBusquedaCompleta() {
    busquedaInicialProcesadaRef.current = true;
    busquedaInicialCanceladaRef.current = true;
    limpiezaUrlPendienteRef.current = true;
    reiniciarBusqueda();
    setSearchParams({}, { replace: true, preventScrollReset: true });
  }

  function limpiarFiltrosBusqueda() {
    const consulta = ultimaBusqueda?.q ?? filtros.q.trim();
    if (!consulta) {
      reiniciarBusquedaCompleta();
      return;
    }

    const filtrosBase = { ...FILTROS_INICIALES, q: consulta };
    setFiltros(filtrosBase);
    buscar(conFiltroDisponible(filtrosBase));
  }

  const filtroPerdido = filtros.soloPropias && filtroPropias.resuelto && !filtroPropias.disponible;

  useEffect(() => {
    if (!filtroPerdido) {
      return;
    }
    const nextFiltros = { ...filtros, soloPropias: false };
    setFiltros(nextFiltros);
    if (
      ultimaBusqueda?.soloPropias &&
      validarFiltros({ ...nextFiltros, q: ultimaBusqueda.q }).success
    ) {
      buscarConFiltros(nextFiltros);
    }
  }, [filtroPerdido, filtros, setFiltros, ultimaBusqueda, buscarConFiltros]);

  const seleccionDesactualizada =
    Boolean(ultimaBusqueda?.soloPropias) &&
    filtroPropias.disponible &&
    !isLoading &&
    ultimaBusqueda.firmaPlataformas !== filtroPropias.firma;

  useEffect(() => {
    if (seleccionDesactualizada) {
      buscar({ ...ultimaBusqueda, firmaPlataformas: filtroPropias.firma });
    }
  }, [seleccionDesactualizada, ultimaBusqueda, filtroPropias.firma, buscar]);

  return (
    <>
      <header className="mb-12 max-w-2xl space-y-3">
        <p className="font-mono text-xs font-medium tracking-[0.2em] text-primary uppercase">
          {APP_NAME}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Una búsqueda. Todas tus plataformas.
        </h1>
        <p className="text-base leading-7 text-muted sm:text-lg">
          Buscá películas y series por título, género, actor o director.
        </p>
      </header>

      <FormularioBusqueda
        filtros={filtros}
        filtroPropias={filtroPropias}
        isLoading={isLoading}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCambiarSoloPropias={(activo) => actualizarFiltro('soloPropias', activo)}
        onCambiarPersona={cambiarPersona}
        onCambiarNombrePersona={actualizarNombrePersona}
        onLimpiarFiltros={limpiarFiltrosBusqueda}
        onQuitarFiltro={(nombre) => actualizarFiltro(nombre, '')}
        generos={generosBusqueda.generos}
        isLoadingGeneros={generosBusqueda.isLoading}
        errorGeneros={generosBusqueda.error}
        generosCargados={generosBusqueda.cargado}
        onCargarGeneros={generosBusqueda.cargar}
        onReintentarGeneros={generosBusqueda.reintentar}
      />

      <ResultadosBusqueda
        resultados={resultados}
        pagina={pagina}
        totalPaginas={totalPaginas}
        totalResultados={totalResultados}
        verificacionIncompleta={verificacionIncompleta}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        error={error}
        hasSearched={hasSearched}
        busquedaFiltrada={Boolean(ultimaBusqueda?.soloPropias)}
        hayFiltrosAvanzados={tieneFiltrosAvanzados(ultimaBusqueda ?? {})}
        tituloBuscado={ultimaBusqueda?.q ?? filtros.q.trim()}
        onReintentar={() => buscar(ultimaBusqueda)}
        onCargarMas={cargarMas}
        onVerTodos={() => actualizarFiltro('soloPropias', false)}
      />
    </>
  );
}
