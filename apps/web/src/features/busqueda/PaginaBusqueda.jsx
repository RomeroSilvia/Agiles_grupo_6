import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { APP_NAME } from '../../config/app.config.js';
import { useBusqueda } from './useBusqueda.js';
import { convertirFiltros, tieneFiltrosAvanzados, validarFiltros } from './busquedaReducer.js';
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
    actorNombre: searchParams.get('actorNombre') ?? '',
    director: searchParams.get('director') ?? '',
    directorNombre: searchParams.get('directorNombre') ?? '',
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

function crearSearchParams(
  { q, tipo, anio, genero, actor, actorNombre, director, directorNombre, soloPropias },
  pagina,
) {
  const params = new URLSearchParams();
  params.set('q', q.trim());
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
    if (actorNombre) {
      params.set('actorNombre', actorNombre);
    }
  }
  if (director) {
    params.set('director', director);
    if (directorNombre) {
      params.set('directorNombre', directorNombre);
    }
  }
  if (soloPropias) {
    params.set('propias', 'true');
  }
  params.set('pagina', String(pagina));
  return params;
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
  const limpiezaUrlPendienteRef = useRef(false);

  useEffect(() => {
    if (
      busquedaInicialProcesadaRef.current ||
      !busquedaInicial.consulta ||
      hasSearched ||
      (busquedaInicial.filtros.soloPropias && !filtroPropias.resuelto)
    ) {
      return;
    }

    busquedaInicialProcesadaRef.current = true;
    buscarHastaPagina(
      {
        ...busquedaInicial.filtros,
        soloPropias: busquedaInicial.filtros.soloPropias && filtroPropias.disponible,
        firmaPlataformas: filtroPropias.firma,
      },
      busquedaInicial.consulta.pagina,
    );
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

    if (hasSearched && nombre !== 'q' && validarFiltros(filtrosParaValidar).success) {
      buscarConFiltros(conFiltroDisponible(nextFiltros));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (ultimaBusqueda && filtros.q.trim() !== ultimaBusqueda.q) {
      const nuevosFiltros = { q: filtros.q, tipo: '', anio: '', soloPropias: false };
      const filtrosIniciales = {
        ...filtros,
        ...nuevosFiltros,
        genero: '',
        actor: '',
        actorNombre: '',
        director: '',
        directorNombre: '',
      };
      setFiltros(filtrosIniciales);
      buscar(conFiltroDisponible(filtrosIniciales));
      return;
    }

    buscar(conFiltroDisponible(filtros));
  }

  function handleChange(event) {
    actualizarFiltro(event.target.name, event.target.value);
  }

  function cambiarPersona(rol, persona, consulta = '') {
    const nombre = rol === 'actor' ? 'actorNombre' : 'directorNombre';
    const teniaSeleccion = Boolean(filtros[rol]);
    const nextFiltros = {
      ...filtros,
      [rol]: persona ? String(persona.id) : '',
      [nombre]: persona?.nombre ?? consulta,
    };
    setFiltros(nextFiltros);

    if (
      hasSearched &&
      (persona || teniaSeleccion) &&
      validarFiltros({ ...nextFiltros, q: ultimaBusqueda?.q ?? '' }).success
    ) {
      buscarConFiltros(conFiltroDisponible(nextFiltros));
    }
  }

  function limpiarFiltrosBusqueda() {
    const hayFiltrosAvanzados =
      tieneFiltrosAvanzados(filtros) ||
      Boolean(filtros.actorNombre.trim() || filtros.directorNombre.trim());

    if (ultimaBusqueda && hayFiltrosAvanzados) {
      const filtrosBase = {
        ...filtros,
        ...convertirFiltros(ultimaBusqueda),
        genero: '',
        actor: '',
        actorNombre: '',
        director: '',
        directorNombre: '',
        soloPropias: false,
      };
      setFiltros(filtrosBase);
      buscar(conFiltroDisponible(filtrosBase));
      return;
    }

    busquedaInicialProcesadaRef.current = true;
    limpiezaUrlPendienteRef.current = true;
    reiniciarBusqueda();
    setSearchParams({}, { replace: true, preventScrollReset: true });
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
        onLimpiarFiltros={limpiarFiltrosBusqueda}
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
        hayFiltrosAvanzados={Boolean(
          ultimaBusqueda?.genero || ultimaBusqueda?.actor || ultimaBusqueda?.director,
        )}
        tituloBuscado={ultimaBusqueda?.q ?? filtros.q.trim()}
        onReintentar={() => buscar(ultimaBusqueda)}
        onCargarMas={cargarMas}
        onVerTodos={() => actualizarFiltro('soloPropias', false)}
      />
    </>
  );
}
