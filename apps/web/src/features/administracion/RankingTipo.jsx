import { TIPO_TITULO } from '@buscador/shared/constants';
import { formatearNumero } from '../../utils/formatearNumero.js';
import { ETIQUETAS_TIPO_TITULO } from '../busqueda/busqueda.constants.js';
import { calcularPorcentajesTipo } from './metricas.utils.js';
import { SinDatosRanking } from './SinDatosRanking.jsx';

const COLORES_TIPO = Object.freeze({
  [TIPO_TITULO.PELICULA]: 'bg-primary',
  [TIPO_TITULO.SERIE]: 'bg-grafico-secundario',
});

function textoCantidad(cantidad) {
  return `${formatearNumero(cantidad)} ${cantidad === 1 ? 'título' : 'títulos'}`;
}

export function RankingTipo({ ranking }) {
  const tipos = calcularPorcentajesTipo(ranking);

  if (tipos.length === 0) {
    return <SinDatosRanking />;
  }

  return (
    <div className="space-y-4">
      <div aria-hidden="true" className="flex h-8 gap-0.5 overflow-hidden rounded-lg sm:h-10">
        {tipos.map(({ tipo, porcentaje }) => (
          <span key={tipo} className={COLORES_TIPO[tipo]} style={{ width: `${porcentaje}%` }} />
        ))}
      </div>
      <dl className="flex justify-between gap-4">
        {tipos.map(({ tipo, cantidad, porcentaje }) => (
          <div key={tipo} className="space-y-1 last:text-right">
            <dt className="inline-flex items-center gap-2 text-sm font-medium">
              <span aria-hidden="true" className={`size-2.5 rounded-sm ${COLORES_TIPO[tipo]}`} />
              {ETIQUETAS_TIPO_TITULO[tipo]}
            </dt>
            <dd className="font-display text-3xl font-bold">{porcentaje}%</dd>
            <dd className="font-mono text-xs text-muted">{textoCantidad(cantidad)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
