import { Link } from 'react-router';
import { LogoPlataforma } from '../plataformas/LogoPlataforma.jsx';
import { ETIQUETAS_TIPO_TITULO, MAX_LOGOS_POR_CARD } from './busqueda.constants.js';

export const resultadoCardClassName =
  'overflow-hidden rounded-2xl border border-border bg-surface shadow-sm';

function obtenerEtiquetaEnlace({ nombre, plataformas = [] }) {
  if (plataformas.length === 0) {
    return `Ver detalle de ${nombre}`;
  }
  const nombresPlataformas = plataformas.map((plataforma) => plataforma.nombre).join(', ');
  return `Ver detalle de ${nombre}, disponible en ${nombresPlataformas}`;
}

export function ResultadoCard({ resultado, estadoBusqueda }) {
  const plataformas = resultado.plataformas ?? [];
  const visibles = plataformas.slice(0, MAX_LOGOS_POR_CARD);
  const ocultas = plataformas.length - visibles.length;

  return (
    <Link
      to={`/titulos/${resultado.tipo}/${resultado.tmdbId}`}
      state={{ busqueda: estadoBusqueda }}
      aria-label={obtenerEtiquetaEnlace(resultado)}
      className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <article
        className={`${resultadoCardClassName} flex h-full flex-col transition group-hover:-translate-y-0.5 group-hover:shadow-md`}
      >
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
        <div className="flex flex-1 flex-col gap-2 p-4">
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
          {visibles.length > 0 && (
            <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3">
              {visibles.map((plataforma) => (
                <span key={plataforma.id} title={plataforma.nombre} className="inline-flex">
                  <LogoPlataforma plataforma={plataforma} />
                </span>
              ))}
              {ocultas > 0 && (
                <span className="font-mono text-xs font-medium text-muted">+{ocultas}</span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
