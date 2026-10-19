import { Button } from '../../components/ui/Button.jsx';

export function EstadoSinResultadosPropios({
  verificacionIncompleta,
  puedeSeguirBuscando,
  buscando,
  onSeguirBuscando,
  onReintentar,
  onVerTodos,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-4 rounded-2xl border border-border bg-surface p-5 text-muted"
    >
      <p>
        {verificacionIncompleta
          ? 'No encontramos títulos en tus plataformas, pero no pudimos confirmar la disponibilidad de algunos.'
          : 'Ninguno de los títulos encontrados está disponible en tus plataformas.'}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="compact" fullWidth={false} onClick={onVerTodos}>
          Ver todos los resultados
        </Button>
        {verificacionIncompleta && (
          <Button
            variant="outline"
            size="compact"
            fullWidth={false}
            onClick={onReintentar}
            disabled={buscando}
          >
            Reintentar
          </Button>
        )}
        {puedeSeguirBuscando && (
          <Button
            variant="outline"
            size="compact"
            fullWidth={false}
            onClick={onSeguirBuscando}
            loading={buscando}
            loadingText="Buscando…"
          >
            Seguir buscando
          </Button>
        )}
      </div>
    </div>
  );
}
