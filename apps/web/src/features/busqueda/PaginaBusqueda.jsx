import { busquedaSchema } from '@buscador/shared/schemas';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useBusqueda } from './useBusqueda.js';
import { useFiltroPlataformasPropias } from './useFiltroPlataformasPropias.js';
import { FormularioBusqueda } from './FormularioBusqueda.jsx';
import { ResultadosBusqueda } from './ResultadosBusqueda.jsx';

function esBusquedaValida(filtros) {
  return busquedaSchema.safeParse({
    q: filtros.q,
    tipo: filtros.tipo || undefined,
    anio: filtros.anio || undefined,
    pagina: 1,
  }).success;
}

function obtenerBusquedaInicial(searchParams) {
  const filtros = {
    q: searchParams.get('q') ?? '',
    tipo: searchParams.get('tipo') ?? '',
    anio: searchParams.get('anio') ?? '',
    soloPropias: searchParams.get('propias') === 'true',
  };
  const validacion = busquedaSchema.safeParse({
    q: filtros.q,
    tipo: filtros.tipo || undefined,
    anio: filtros.anio || undefined,
    pagina: searchParams.get('pagina') ?? 1,
  });

  if (validacion.success) {
    filtros.q = validacion.data.q;
    filtros.tipo = validacion.data.tipo ?? '';
    filtros.anio = validacion.data.anio === undefined ? '' : String(validacion.data.anio);
  }

  return {
    filtros,
    consulta: validacion.success ? validacion.data : null,
  };
}

function crearSearchParams({ q, tipo, anio, soloPropias }, pagina) {
  const params = new URLSearchParams();
  params.set('q', q.trim());
  if (tipo) {
    params.set('tipo', tipo);
  }
  if (anio) {
    params.set('anio', anio);
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
    buscar,
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

  useEffect(() => {
    if (
      busquedaInicial.consulta &&
      !hasSearched &&
      (!busquedaInicial.filtros.soloPropias || filtroPropias.resuelto)
    ) {
      buscar(
        {
          ...busquedaInicial.filtros,
          soloPropias: busquedaInicial.filtros.soloPropias && filtroPropias.disponible,
          firmaPlataformas: filtroPropias.firma,
        },
        { pagina: busquedaInicial.consulta.pagina },
      );
    }
  }, [
    buscar,
    busquedaInicial,
    hasSearched,
    filtroPropias.resuelto,
    filtroPropias.disponible,
    filtroPropias.firma,
  ]);

  useEffect(() => {
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

    if (hasSearched && nombre !== 'q' && esBusquedaValida(filtrosParaValidar)) {
      buscarConFiltros(conFiltroDisponible(nextFiltros));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    buscar(conFiltroDisponible(filtros));
  }

  function handleChange(event) {
    actualizarFiltro(event.target.name, event.target.value);
  }

  const filtroPerdido = filtros.soloPropias && filtroPropias.resuelto && !filtroPropias.disponible;

  useEffect(() => {
    if (!filtroPerdido) {
      return;
    }
    const nextFiltros = { ...filtros, soloPropias: false };
    setFiltros(nextFiltros);
    if (ultimaBusqueda?.soloPropias && esBusquedaValida({ ...nextFiltros, q: ultimaBusqueda.q })) {
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
        <p className="font-mono text-xs font-medium tracking-[0.2em] text-primary">STREAMLY</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Una búsqueda. Todas tus plataformas.
        </h1>
        <p className="text-base leading-7 text-muted sm:text-lg">
          Buscá películas y series por título, tipo o año.
        </p>
      </header>

      <FormularioBusqueda
        filtros={filtros}
        filtroPropias={filtroPropias}
        isLoading={isLoading}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCambiarSoloPropias={(activo) => actualizarFiltro('soloPropias', activo)}
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
        tituloBuscado={ultimaBusqueda?.q ?? filtros.q.trim()}
        onReintentar={() => buscar(ultimaBusqueda)}
        onCargarMas={cargarMas}
        onVerTodos={() => actualizarFiltro('soloPropias', false)}
      />
    </>
  );
}
