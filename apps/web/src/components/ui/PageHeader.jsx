const TITLE_SIZES = {
  page: 'text-3xl',
  hero: 'text-3xl sm:text-4xl',
};

export function PageHeader({ titulo, descripcion, size = 'page', className = '' }) {
  return (
    <header className={`space-y-2 ${className}`}>
      <h1 className={`font-extrabold tracking-tight ${TITLE_SIZES[size]}`}>{titulo}</h1>
      {descripcion && <p className="text-muted">{descripcion}</p>}
    </header>
  );
}
