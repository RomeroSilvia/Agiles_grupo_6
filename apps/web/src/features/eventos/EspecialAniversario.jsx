import { useEffect, useState } from 'react';

const INICIO_ESPECIAL = Date.parse('2026-11-19T00:00:00-03:00');
const FIN_ESPECIAL = Date.parse('2026-11-26T00:00:00-03:00');
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

function obtenerEstadoEspecial() {
  const ahora = Date.now();
  if (ahora >= FIN_ESPECIAL) return null;
  return ahora < INICIO_ESPECIAL ? 'proximo' : 'activo';
}

export function EspecialAniversario() {
  const [estado, setEstado] = useState(obtenerEstadoEspecial);
  useEffect(() => {
    let timeout;
    function actualizar() {
      setEstado(obtenerEstadoEspecial());
      const ahora = Date.now();
      const siguienteCambio = ahora < INICIO_ESPECIAL ? INICIO_ESPECIAL : FIN_ESPECIAL;
      if (ahora < siguienteCambio) {
        timeout = setTimeout(actualizar, Math.min(siguienteCambio - ahora, MAX_TIMEOUT_MS));
      }
    }
    actualizar();
    return () => clearTimeout(timeout);
  }, []);

  if (!estado) return null;
  return (
    <aside
      aria-label="Especial aniversario de La Plata"
      className="mt-6 space-y-2 rounded-field border border-panel-accent/40 p-4"
    >
      <p className="font-semibold text-panel-accent">
        Evento especial · 144.º aniversario de La Plata
      </p>
      <p className="text-sm text-panel-muted">
        {estado === 'proximo' ? 'Se viene una semana' : 'Una semana'} para celebrar la ciudad y
        encontrarnos afuera con Cooltura.
      </p>
      <p className="text-sm font-semibold">
        Del <time dateTime="2026-11-19">19</time> al{' '}
        <time dateTime="2026-11-25">25 de noviembre de 2026</time> · Solo por una semana
      </p>
    </aside>
  );
}
