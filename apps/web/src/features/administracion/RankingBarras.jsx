import { formatearNumero } from '../../utils/formatearNumero.js';
import { PORCENTAJE_TOTAL } from './metricas.utils.js';
import { SinDatosRanking } from './SinDatosRanking.jsx';

export function RankingBarras({ label, items, renderIcono }) {
  if (items.length === 0) {
    return <SinDatosRanking />;
  }

  const maximo = Math.max(...items.map(({ cantidad }) => cantidad));

  return (
    <ol aria-label={label} className="space-y-3">
      {items.map((item) => (
        <li
          key={item.clave}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]"
        >
          <span className="flex min-w-0 items-center gap-2.5 text-sm">
            {renderIcono?.(item)}
            <span className="truncate">{item.etiqueta}</span>
          </span>
          <span
            aria-hidden="true"
            className="order-last col-span-2 h-2 overflow-hidden rounded-full bg-border sm:order-none sm:col-span-1 sm:h-3"
          >
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${(item.cantidad / maximo) * PORCENTAJE_TOTAL}%` }}
            />
          </span>
          <span className="text-right font-mono text-sm text-muted">
            {formatearNumero(item.cantidad)}
          </span>
        </li>
      ))}
    </ol>
  );
}
