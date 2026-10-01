import { ETIQUETAS_TIPO_TITULO } from './busqueda.constants.js';

export function ResultadoCard({ resultado }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-surface-100 bg-surface-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-surface-700 dark:bg-surface-800">
      <div className="aspect-2/3 bg-surface-100 dark:bg-surface-700">
        {resultado.posterUrl ? (
          <img
            src={resultado.posterUrl}
            alt={`Póster de ${resultado.nombre}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-ink-muted dark:text-surface-200">
            Sin imagen disponible
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-700/30 dark:text-brand-100">
          {ETIQUETAS_TIPO_TITULO[resultado.tipo]}
        </span>
        <h3 className="line-clamp-2 text-base font-semibold text-surface-900 dark:text-surface-0">
          {resultado.nombre}
        </h3>
        <p className="text-sm text-ink-muted dark:text-surface-200">
          {resultado.anio ?? 'Año desconocido'}
          {resultado.puntuacion !== null && ` · ${resultado.puntuacion.toFixed(1)}/10`}
        </p>
      </div>
    </article>
  );
}
