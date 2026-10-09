export function Poster({ posterUrl, nombre, className = '', loading = 'lazy' }) {
  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden bg-background ${className}`}
    >
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={`Póster de ${nombre}`}
          className="absolute inset-0 h-full w-full object-cover"
          loading={loading}
        />
      ) : (
        <div className="p-4 text-center text-sm text-muted">Sin imagen disponible</div>
      )}
    </div>
  );
}
