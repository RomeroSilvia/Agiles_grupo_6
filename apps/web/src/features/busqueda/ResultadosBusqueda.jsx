import { CARDS_CARGANDO } from './busqueda.constants.js';
import { EstadoSinResultadosPropios } from './EstadoSinResultadosPropios.jsx';
import { ResultadoCard } from './ResultadoCard.jsx';
import { ResultadoCardCargando } from './ResultadoCardCargando.jsx';

const CARDS_ESQUELETO = Array.from({ length: CARDS_CARGANDO }, (_, indice) => indice);

const VISTAS_RESULTADOS = Object.freeze({
  CARGANDO: 'CARGANDO',
  ERROR: 'ERROR',
  SIN_RESULTADOS_PROPIOS: 'SIN_RESULTADOS_PROPIOS',
  SIN_RESULTADOS: 'SIN_RESULTADOS',
  RESULTADOS: 'RESULTADOS',
});

function obtenerVista({
  isLoading,
  isLoadingMore,
  error,
  hasSearched,
  hayResultados,
  busquedaFiltrada,
}) {
  if (isLoading && !isLoadingMore) {
    return VISTAS_RESULTADOS.CARGANDO;
  }
  if (hayResultados) {
    return VISTAS_RESULTADOS.RESULTADOS;
  }
  if (error) {
    return VISTAS_RESULTADOS.ERROR;
  }
  if (!hasSearched) {
    return null;
  }
  return busquedaFiltrada
    ? VISTAS_RESULTADOS.SIN_RESULTADOS_PROPIOS
    : VISTAS_RESULTADOS.SIN_RESULTADOS;
}

function GrillaResultados({ children }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{children}</div>;
}

function CardsCargando() {
  return CARDS_ESQUELETO.map((indice) => <ResultadoCardCargando key={indice} />);
}

export function ResultadosBusqueda({
  resultados,
  pagina,
  totalPaginas,
  totalResultados,
  verificacionIncompleta,
  isLoading,
  isLoadingMore,
  error,
  hasSearched,
  busquedaFiltrada,
  tituloBuscado,
  estadoBusqueda,
  onReintentar,
  onCargarMas,
  onVerTodos,
}) {
  const vista = obtenerVista({
    isLoading,
    isLoadingMore,
    error,
    hasSearched,
    hayResultados: resultados.length > 0,
    busquedaFiltrada,
  });
  const hayMasPaginas = pagina < totalPaginas;
  const mostrarVerificacionIncompleta = busquedaFiltrada && verificacionIncompleta;

  return (
    <section>
      {vista === VISTAS_RESULTADOS.CARGANDO && (
        <>
          <p role="status" aria-live="polite" className="sr-only">
            {busquedaFiltrada ? 'Buscando en tus plataformas...' : 'Buscando títulos...'}
          </p>
          <GrillaResultados>
            <CardsCargando />
          </GrillaResultados>
        </>
      )}

      {vista === VISTAS_RESULTADOS.ERROR && (
        <div
          role="alert"
          className="space-y-4 rounded-2xl border border-danger/30 bg-danger-surface p-5 text-danger"
        >
          <p>{error}</p>
          {busquedaFiltrada && (
            <button
              type="button"
              onClick={onReintentar}
              className="rounded-xl border border-danger px-5 py-3 font-semibold transition hover:bg-danger/10 focus:ring-4 focus:ring-danger/30 focus:outline-none"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {vista === VISTAS_RESULTADOS.SIN_RESULTADOS_PROPIOS && (
        <EstadoSinResultadosPropios
          verificacionIncompleta={mostrarVerificacionIncompleta}
          puedeSeguirBuscando={hayMasPaginas}
          buscando={isLoadingMore}
          onSeguirBuscando={onCargarMas}
          onReintentar={onReintentar}
          onVerTodos={onVerTodos}
        />
      )}

      {vista === VISTAS_RESULTADOS.SIN_RESULTADOS && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-border bg-surface p-5 text-muted"
        >
          No encontramos contenido disponible con esos filtros.
        </p>
      )}

      {vista === VISTAS_RESULTADOS.RESULTADOS && (
        <>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Resultados para &quot;{tituloBuscado}&quot;</h2>
            <p role="status" aria-live="polite" className="text-sm text-muted">
              {busquedaFiltrada
                ? 'Resultados encontrados para tus plataformas'
                : `Mostrando ${resultados.length} de ${totalResultados} ${totalResultados === 1 ? 'título' : 'títulos'}`}
            </p>
          </div>
          {mostrarVerificacionIncompleta && (
            <div
              role="status"
              className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between"
            >
              <p>
                No pudimos verificar todos los títulos. Puede haber más disponibles en tus
                plataformas.
              </p>
              <button
                type="button"
                onClick={onReintentar}
                disabled={isLoading}
                className="shrink-0 rounded-xl border border-primary px-4 py-2 font-semibold text-primary transition hover:bg-primary/10 focus:ring-4 focus:ring-primary/30 focus:outline-none disabled:cursor-wait disabled:opacity-60"
              >
                Reintentar
              </button>
            </div>
          )}
          <GrillaResultados>
            {resultados.map((resultado) => (
              <ResultadoCard
                key={`${resultado.tipo}-${resultado.tmdbId}`}
                resultado={resultado}
                estadoBusqueda={estadoBusqueda}
              />
            ))}
            {isLoadingMore && <CardsCargando />}
          </GrillaResultados>
          {hayMasPaginas && (
            <>
              <button
                type="button"
                onClick={onCargarMas}
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
  );
}
