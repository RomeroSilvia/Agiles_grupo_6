import { Alert } from '../../components/ui/Alert.jsx';
import { AttributionDisponibilidad } from '../../components/ui/Attribution.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { LoadMoreButton } from '../../components/ui/LoadMoreButton.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { CardsCargando } from './CardsCargando.jsx';
import { EstadoSinResultadosPropios } from './EstadoSinResultadosPropios.jsx';
import { GrillaResultados } from './GrillaResultados.jsx';
import { ResultadoCard } from './ResultadoCard.jsx';

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
          {resultados.some((resultado) => resultado.plataformas?.length > 0) && (
            <AttributionDisponibilidad />
          )}
          {hayMasPaginas && (
            <>
              <LoadMoreButton
                className="mt-3"
                onClick={onCargarMas}
                disabled={isLoading}
                loading={isLoadingMore}
              />
              {error && <Alert className="mx-auto max-w-md">{error}</Alert>}
            </>
          )}
        </>
      )}
    </section>
  );
}
