import { busquedaSchema } from '@buscador/shared/schemas';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useLocationStateSync } from '../../hooks/useLocationStateSync.js';
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

export function PaginaBusqueda() {
  const location = useLocation();
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
    isLoading,
    isLoadingMore,
    error,
    hasSearched,
    ultimaBusqueda,
    estadoGuardable,
  } = useBusqueda(location.state?.busqueda);
  const filtroPropias = useFiltroPlataformasPropias();

  useLocationStateSync('busqueda', estadoGuardable);

  function conFiltroDisponible(filtrosConsulta) {
    return {
      ...filtrosConsulta,
      soloPropias: filtrosConsulta.soloPropias && filtroPropias.disponible,
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
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        error={error}
        hasSearched={hasSearched}
        busquedaFiltrada={Boolean(ultimaBusqueda?.soloPropias)}
        tituloBuscado={ultimaBusqueda?.q ?? filtros.q.trim()}
        estadoBusqueda={estadoGuardable}
        onReintentar={() => buscar(ultimaBusqueda)}
        onCargarMas={cargarMas}
        onVerTodos={() => actualizarFiltro('soloPropias', false)}
      />
    </>
  );
}
