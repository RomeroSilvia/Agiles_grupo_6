import { busquedaSchema } from '@buscador/shared/schemas';
import { ANIO_MAXIMO, ANIO_MINIMO, TIPOS_TITULO } from '@buscador/shared/constants';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useLocationStateSync } from '../../hooks/useLocationStateSync.js';
import { useBusqueda } from './useBusqueda.js';
import { useFiltroPlataformasPropias } from './useFiltroPlataformasPropias.js';
import { CARDS_CARGANDO, ETIQUETAS_TIPO_TITULO } from './busqueda.constants.js';
import { EstadoSinResultadosPropios } from './EstadoSinResultadosPropios.jsx';
import { FiltroPlataformasPropias } from './FiltroPlataformasPropias.jsx';
import { ResultadoCard } from './ResultadoCard.jsx';
import { ResultadoCardCargando } from './ResultadoCardCargando.jsx';

const CARDS_ESQUELETO = Array.from({ length: CARDS_CARGANDO }, (_, indice) => indice);

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
    verificacionIncompleta,
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

  const tituloBuscado = ultimaBusqueda?.q ?? filtros.q.trim();
  const busquedaFiltrada = Boolean(ultimaBusqueda?.soloPropias);

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

      <form
        aria-label="Buscar títulos"
        className="mb-12 space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <label
            htmlFor="q"
            className="font-mono text-xs font-medium tracking-wide text-muted uppercase"
          >
            Título
          </label>
          <input
            id="q"
            name="q"
            type="search"
            value={filtros.q}
            onChange={handleChange}
            placeholder="Ej.: Dune, The Office..."
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition outline-none placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
        </div>

        <div
          className={`grid gap-5 sm:grid-cols-2 lg:items-end ${filtroPropias.visible ? 'lg:grid-cols-[1fr_1fr_auto_auto]' : 'lg:grid-cols-[1fr_1fr_auto]'}`}
        >
          <div className="space-y-2">
            <label
              htmlFor="tipo"
              className="font-mono text-xs font-medium tracking-wide text-muted uppercase"
            >
              Tipo
            </label>
            <select
              id="tipo"
              name="tipo"
              value={filtros.tipo}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            >
              <option value="">Todos</option>
              {TIPOS_TITULO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETAS_TIPO_TITULO[tipo]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="anio"
              className="font-mono text-xs font-medium tracking-wide text-muted uppercase"
            >
              Año
            </label>
            <input
              id="anio"
              name="anio"
              type="number"
              min={ANIO_MINIMO}
              max={ANIO_MAXIMO}
              value={filtros.anio}
              onChange={handleChange}
              placeholder="Cualquier año"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition outline-none placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
          </div>

          <FiltroPlataformasPropias
            filtro={filtroPropias}
            activo={filtros.soloPropias}
            onChange={(activo) => actualizarFiltro('soloPropias', activo)}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-hover focus:ring-4 focus:ring-primary/30 focus:outline-none disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      <section>
        {isLoading && !isLoadingMore && (
          <>
            <p role="status" aria-live="polite" className="sr-only">
              {busquedaFiltrada ? 'Buscando en tus plataformas...' : 'Buscando títulos...'}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {CARDS_ESQUELETO.map((indice) => (
                <ResultadoCardCargando key={indice} />
              ))}
            </div>
          </>
        )}

        {!isLoading && error && resultados.length === 0 && (
          <div
            role="alert"
            className="space-y-4 rounded-2xl border border-danger/30 bg-danger-surface p-5 text-danger"
          >
            <p>{error}</p>
            {busquedaFiltrada && (
              <button
                type="button"
                onClick={() => buscar(ultimaBusqueda)}
                className="rounded-xl border border-danger px-5 py-3 font-semibold transition hover:bg-danger/10 focus:ring-4 focus:ring-danger/30 focus:outline-none"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && hasSearched && resultados.length === 0 && busquedaFiltrada && (
          <EstadoSinResultadosPropios
            puedeSeguirBuscando={pagina < totalPaginas}
            buscando={isLoadingMore}
            onSeguirBuscando={cargarMas}
            onVerTodos={() => actualizarFiltro('soloPropias', false)}
          />
        )}

        {!isLoading && !error && hasSearched && resultados.length === 0 && !busquedaFiltrada && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-border bg-surface p-5 text-muted"
          >
            No encontramos contenido disponible con esos filtros.
          </p>
        )}

        {resultados.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Resultados para &quot;{tituloBuscado}&quot;</h2>
              <p role="status" aria-live="polite" className="text-sm text-muted">
                {busquedaFiltrada
                  ? 'Resultados encontrados para tus plataformas'
                  : `Mostrando ${resultados.length} de ${totalResultados} ${totalResultados === 1 ? 'título' : 'títulos'}`}
              </p>
            </div>
            {verificacionIncompleta && (
              <p className="mb-5 rounded-xl bg-chip px-4 py-3 text-sm font-medium text-chip-foreground">
                No pudimos verificar algunos títulos, puede que falten resultados.
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {resultados.map((resultado) => (
                <ResultadoCard
                  key={`${resultado.tipo}-${resultado.tmdbId}`}
                  resultado={resultado}
                  estadoBusqueda={estadoGuardable}
                />
              ))}
              {isLoadingMore &&
                CARDS_ESQUELETO.map((indice) => (
                  <ResultadoCardCargando key={`cargando-${indice}`} />
                ))}
            </div>
            {pagina < totalPaginas && (
              <>
                <button
                  type="button"
                  onClick={cargarMas}
                  disabled={isLoading}
                  className="mx-auto mt-8 block rounded-xl border border-primary px-6 py-3 font-semibold text-primary transition hover:bg-primary/10 focus:ring-4 focus:ring-primary/30 focus:outline-none disabled:cursor-wait disabled:opacity-60"
                >
                  {isLoadingMore ? 'Cargando...' : 'Cargar más'}
                </button>
                {error && (
                  <p
                    role="alert"
                    className="mx-auto mt-4 max-w-md rounded-2xl border border-danger/30 bg-danger-surface p-4 text-center text-danger"
                  >
                    {error}
                  </p>
                )}
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
