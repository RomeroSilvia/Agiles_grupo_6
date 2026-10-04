const botonSecundarioClassName =
  'rounded-xl border border-primary px-5 py-3 font-semibold text-primary transition hover:bg-primary/10 focus:ring-4 focus:ring-primary/30 focus:outline-none disabled:cursor-wait disabled:opacity-60';

export function EstadoSinResultadosPropios({
  puedeSeguirBuscando,
  buscando,
  onSeguirBuscando,
  onVerTodos,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-4 rounded-2xl border border-border bg-surface p-5 text-muted"
    >
      <p>Ninguno de los títulos encontrados está disponible en tus plataformas.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onVerTodos}
          className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary-hover focus:ring-4 focus:ring-primary/30 focus:outline-none"
        >
          Ver todos los resultados
        </button>
        {puedeSeguirBuscando && (
          <button
            type="button"
            onClick={onSeguirBuscando}
            disabled={buscando}
            className={botonSecundarioClassName}
          >
            {buscando ? 'Buscando...' : 'Seguir buscando'}
          </button>
        )}
      </div>
    </div>
  );
}
