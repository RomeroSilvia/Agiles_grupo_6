import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { ExternalLink } from '../../components/ui/ExternalLink.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { EventoCard } from './EventoCard.jsx';
import { useEventos } from './useEventos.js';

export function ListaEventos({ categoria, fecha }) {
  const {
    resultados,
    siguientePagina,
    fuente,
    incompleta,
    loading,
    loadingMore,
    error,
    cargarMas,
    reintentar,
  } = useEventos({ categoria, fecha });
  return (
    <section
      aria-labelledby="eventos-titulo"
      className="space-y-5"
      aria-busy={loading || loadingMore}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="eventos-titulo" className="text-2xl font-bold">
          Tu próxima salida
        </h2>
        {fuente && (
          <p className="text-sm text-muted">
            {resultados.length} {resultados.length === 1 ? 'evento' : 'eventos'} para explorar
          </p>
        )}
      </div>
      {loading && (
        <>
          <p role="status" className="sr-only">
            Buscando eventos en La Plata…
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((id) => (
              <Skeleton key={id} className="h-96 rounded-card" />
            ))}
          </div>
        </>
      )}
      {error && <Alert onRetry={reintentar}>{error}</Alert>}
      {!loading && !error && resultados.length === 0 && (
        <Card padding="lg">
          <p role="status">
            No encontramos eventos presenciales en La Plata para esta selección. Probá con otra
            categoría o período.
          </p>
        </Card>
      )}
      {incompleta && (
        <Alert tone="info">
          Algunas publicaciones no tienen datos suficientes para mostrarse. La lista puede estar
          incompleta.
        </Alert>
      )}
      {resultados.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((evento) => (
            <EventoCard key={evento.id} evento={evento} />
          ))}
        </div>
      )}
      {siguientePagina && !error && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            fullWidth={false}
            onClick={cargarMas}
            loading={loadingMore}
            loadingText="Cargando eventos…"
          >
            Cargar más eventos
          </Button>
        </div>
      )}
      {fuente && (
        <p className="text-sm text-muted">
          Fuente:{' '}
          <ExternalLink
            href={fuente.url}
            className={`rounded-sm text-link underline ${FOCUS_RING_CLASS_NAME}`}
          >
            AllEvents (abre en otra pestaña)
          </ExternalLink>
          . Verificá fecha, lugar y entradas en la publicación antes de ir. Horarios de La Plata.
        </p>
      )}
    </section>
  );
}
