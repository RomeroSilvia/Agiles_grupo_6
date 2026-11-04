import { NOMBRES_REGION } from '@buscador/shared/constants';
import { Chip } from '../../components/ui/Chip.jsx';
import { columnasComparacion, plataformasPorTipo } from './comparacion.js';
import { ETIQUETAS_OFERTA } from './detalle.constants.js';
import { ListaPlataformasOferta } from './ListaOfertas.jsx';

const CELDA_CLASS_NAME = 'md:px-4 md:py-3 md:align-middle';

export function TablaComparacion({ filas, nombreTitulo }) {
  const columnas = columnasComparacion(filas);

  return (
    <div className="overflow-hidden rounded-card border border-border">
      <table aria-label="Resultados de comparación por región" className="w-full text-sm">
        <thead className="max-md:sr-only">
          <tr className="border-b border-border text-left font-mono text-xs text-muted uppercase">
            <th scope="col" className={`${CELDA_CLASS_NAME} font-medium`}>
              Región
            </th>
            {columnas.map((tipo) => (
              <th key={tipo} scope="col" className={`${CELDA_CLASS_NAME} font-medium`}>
                {ETIQUETAS_OFERTA[tipo]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filas.map(({ region, ofertas, esActual }) => (
            <tr
              key={region}
              className={`grid gap-3 p-4 md:table-row md:p-0 ${esActual ? 'bg-chip/50' : ''}`}
            >
              <th scope="row" className={`${CELDA_CLASS_NAME} text-left font-semibold`}>
                <span className="flex flex-wrap items-center gap-2">
                  <span>{NOMBRES_REGION[region] ?? region}</span>
                  <Chip>{region}</Chip>
                  {esActual && <span className="text-xs font-normal text-muted">Tu región</span>}
                </span>
              </th>
              {columnas.map((tipo) => {
                const plataformas = plataformasPorTipo(ofertas, tipo);

                return (
                  <td key={tipo} className={CELDA_CLASS_NAME}>
                    <span className="mb-1.5 block text-xs text-muted md:hidden">
                      {ETIQUETAS_OFERTA[tipo]}
                    </span>
                    {plataformas.length > 0 ? (
                      <ListaPlataformasOferta
                        plataformas={plataformas}
                        nombreTitulo={nombreTitulo}
                        etiqueta={`Plataformas en ${region}: ${ETIQUETAS_OFERTA[tipo]}`}
                        size="sm"
                      />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
