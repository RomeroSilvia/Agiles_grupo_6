import { Link } from 'react-router';
import { ETIQUETAS_TIPO_TITULO } from './busqueda.constants.js';

export function ResultadoCard({ resultado, estadoBusqueda }) {
  return (
    <Link
      to={`/titulos/${resultado.tipo}/${resultado.tmdbId}`}
      state={{ busqueda: estadoBusqueda }}
      aria-label={`Ver detalle de ${resultado.nombre}`}
      className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
        <div className="aspect-2/3 bg-background">
          {resultado.posterUrl ? (
            <img
              src={resultado.posterUrl}
              alt={`Póster de ${resultado.nombre}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted">
              Sin imagen disponible
            </div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <span className="inline-flex rounded-full bg-chip px-2.5 py-1 font-mono text-xs font-medium text-chip-foreground">
            {ETIQUETAS_TIPO_TITULO[resultado.tipo]}
          </span>
          <h3 className="line-clamp-2 text-base font-semibold text-foreground">
            {resultado.nombre}
          </h3>
          <p className="text-sm text-muted">
            {resultado.anio ?? 'Año desconocido'}
            {resultado.puntuacion !== null && ` · ${resultado.puntuacion.toFixed(1)}/10`}
          </p>
        </div>
      </article>
    </Link>
  );
}
