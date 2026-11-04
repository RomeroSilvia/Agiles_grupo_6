import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
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
  hayFiltrosAvanzados,
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
  if (hayFiltrosAvanzados) {
    return VISTAS_RESULTADOS.SIN_RESULTADOS;
  }
  return busquedaFiltrada
    ? VISTAS_RESULTADOS.SIN_RESULTADOS_PROPIOS
    : VISTAS_RESULTADOS.SIN_RESULTADOS;
}

function GrillaResultados({ children }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">{children}</div>
  );
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
  hayFiltrosAvanzados,
  tituloBuscado,
  onReintentar,
  onCargarMas,
  onVerTodos,
  acciones,
}) {
  const vista = obtenerVista({
    isLoading,
    isLoadingMore,
    error,
    hasSearched,
    hayResultados: resultados.length > 0,
    busquedaFiltrada,
    hayFiltrosAvanzados,
  });
  const hayMasPaginas = pagina < totalPaginas;
  const mostrarVerificacionIncompleta = busquedaFiltrada && verificacionIncompleta;

  const hayResultados = vista === VISTAS_RESULTADOS.RESULTADOS;

  return (
    <section className="space-y-5">
      {(hayResultados || acciones) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {hayResultados ? (
            <div className="space-y-1">
              <SectionTitle>
                {tituloBuscado
                  ? `Resultados para "${tituloBuscado}"`
                  : 'Resultados con los filtros seleccionados'}
              </SectionTitle>
              <p role="status" aria-live="polite" className="text-sm text-muted">
                {busquedaFiltrada
                  ? 'Resultados encontrados para tus plataformas'
                  : hayFiltrosAvanzados
                    ? `Mostrando ${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'}`
                    : `Mostrando ${resultados.length} de ${totalResultados} ${totalResultados === 1 ? 'título' : 'títulos'}`}
              </p>
            </div>
          ) : (
            <span />
          )}
          {acciones}
        </div>
      )}

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
        <Alert onRetry={busquedaFiltrada || hayFiltrosAvanzados ? onReintentar : undefined}>
          {error}
        </Alert>
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
        <Card padding="lg" className="space-y-4 text-muted">
          <p role="status" aria-live="polite">
            {hayFiltrosAvanzados && hayMasPaginas
              ? 'Todavía no encontramos coincidencias en estas páginas.'
              : hayFiltrosAvanzados
                ? 'No hay resultados para esa combinación de filtros.'
                : 'No encontramos contenido disponible con esos filtros.'}
          </p>
          {hayFiltrosAvanzados && hayMasPaginas && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCargarMas}
              size="compact"
              fullWidth={false}
              disabled={isLoading}
              loading={isLoadingMore}
              loadingText="Buscando…"
            >
              Seguir buscando
            </Button>
          )}
        </Card>
      )}

      {hayResultados && (
        <>
          {mostrarVerificacionIncompleta && (
            <Alert tone="info" onRetry={onReintentar} retryDisabled={isLoading}>
              No pudimos verificar todos los títulos. Puede haber más disponibles en tus
              plataformas.
            </Alert>
          )}
          <GrillaResultados>
            {resultados.map((resultado) => (
              <ResultadoCard key={`${resultado.tipo}-${resultado.tmdbId}`} resultado={resultado} />
            ))}
            {isLoadingMore && <CardsCargando />}
          </GrillaResultados>
          {hayMasPaginas && (
            <>
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  size="compact"
                  fullWidth={false}
                  onClick={onCargarMas}
                  disabled={isLoading}
                  loading={isLoadingMore}
                  loadingText="Cargando…"
                >
                  Cargar más
                </Button>
              </div>
              {error && <Alert className="mx-auto max-w-md">{error}</Alert>}
            </>
          )}
        </>
      )}
    </section>
  );
}
