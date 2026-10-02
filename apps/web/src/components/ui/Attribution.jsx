/**
 * Atribución obligatoria por los términos de uso de TMDB y JustWatch (E6HU3).
 * No quitar: su ausencia puede derivar en la revocación del acceso a la API.
 */
export function Attribution() {
  return (
    <p className="text-xs leading-5 text-muted">
      Datos de títulos provistos por{' '}
      <a href="https://www.themoviedb.org" className="underline" target="_blank" rel="noreferrer">
        TMDB
      </a>{' '}
      y datos de disponibilidad provistos por{' '}
      <a href="https://www.justwatch.com" className="underline" target="_blank" rel="noreferrer">
        JustWatch
      </a>
      . Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
    </p>
  );
}
