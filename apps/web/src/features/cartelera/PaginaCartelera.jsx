import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { ResultadoCard } from '../busqueda/ResultadoCard.jsx';
import { ResultadoCardCargando } from '../busqueda/ResultadoCardCargando.jsx';
import { useCartelera } from './useCartelera.js';

const ESQUELETOS = Array.from({ length: 10 }, (_, indice) => indice);
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {ESQUELETOS.map((indice) => (
                <ResultadoCardCargando key={indice} />
              ))}
            </div>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {resultados.map((pelicula) => (
              <ResultadoCard
                key={`${pelicula.tipo}:${pelicula.tmdbId}`}
                resultado={pelicula}
                contenidoAdicional={contenidoFecha(pelicula)}
              />
            ))}
            {isLoadingMore &&
              ESQUELETOS.slice(0, 5).map((indice) => (
                <ResultadoCardCargando key={`cargando-${indice}`} />
              ))}
          </div>
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
