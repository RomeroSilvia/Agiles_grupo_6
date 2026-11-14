import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { ResultadoCard } from '../busqueda/ResultadoCard.jsx';
import { CardsCargando, GrillaResultados } from '../busqueda/ResultadosBusqueda.jsx';
import { useCartelera } from './useCartelera.js';

const FORMATEADOR_FECHA = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

function contenidoFecha(pelicula) {
  if (!pelicula.fechaEstrenoAr) {
    return 'Fecha de estreno en Argentina no informada';
  }

  const fecha = new Date(`${pelicula.fechaEstrenoAr}T00:00:00.000Z`);
  return (
    <time dateTime={pelicula.fechaEstrenoAr}>
      Estreno en Argentina: {FORMATEADOR_FECHA.format(fecha)}
    </time>
  );
}

export function PaginaCartelera() {
  const {
    resultados,
    pagina,
    totalPaginas,
    isLoading,
    isLoadingMore,
    hasSearched,
    error,
    reintentar,
    cargarMas,
  } = useCartelera();

  return (
    <div className="space-y-7">
      <PageHeader
        titulo="Películas en cartelera"
        descripcion="Consultá las películas que TMDB clasifica actualmente en cartelera en Argentina."
      />

      <Alert tone="info">Cartelera según TMDB; las funciones dependen de cada cine.</Alert>

      <section aria-labelledby="cartelera-titulo" className="space-y-5">
        <SectionTitle id="cartelera-titulo">En cartelera</SectionTitle>

        {isLoading && resultados.length === 0 && (
          <>
            <p role="status" aria-live="polite" className="sr-only">
              Cargando películas en cartelera…
            </p>
            <GrillaResultados>
              <CardsCargando />
            </GrillaResultados>
          </>
        )}

        {error && <Alert onRetry={reintentar}>{error}</Alert>}

        {!isLoading && !error && hasSearched && resultados.length === 0 && (
          <Card padding="lg" className="text-muted">
            <p role="status" aria-live="polite">
              No hay información de cartelera disponible.
            </p>
          </Card>
        )}

        {resultados.length > 0 && (
          <GrillaResultados>
            {resultados.map((pelicula) => (
              <ResultadoCard
                key={`${pelicula.tipo}:${pelicula.tmdbId}`}
                resultado={pelicula}
                contenidoAdicional={contenidoFecha(pelicula)}
              />
            ))}
            {isLoadingMore && <CardsCargando />}
          </GrillaResultados>
        )}

        {pagina < totalPaginas && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="compact"
              fullWidth={false}
              onClick={cargarMas}
              disabled={isLoading}
              loading={isLoadingMore}
              loadingText="Cargando…"
            >
              Cargar más
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
