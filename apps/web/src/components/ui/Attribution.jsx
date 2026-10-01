export function Attribution() {
  return (
    <p className="text-xs leading-5 text-ink-muted dark:text-surface-200">
      Datos de títulos provistos por{' '}
      <a
        href="https://www.themoviedb.org"
        className="font-medium text-brand-600 underline decoration-brand-500/50 underline-offset-2 hover:text-brand-700 dark:text-brand-100 dark:hover:text-surface-0"
        target="_blank"
        rel="noreferrer"
      >
        TMDB
      </a>
      . Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
    </p>
  );
}
