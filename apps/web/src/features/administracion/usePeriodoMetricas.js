import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { metricasAdminSchema } from '@buscador/shared/schemas';

const PERIODO_POR_DEFECTO = metricasAdminSchema.parse({}).periodo;

export function usePeriodoMetricas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resultado = metricasAdminSchema.shape.periodo.safeParse(
    searchParams.get('periodo') ?? undefined,
  );
  const periodo = resultado.success ? resultado.data : PERIODO_POR_DEFECTO;

  const cambiarPeriodo = useCallback(
    (nuevoPeriodo) => {
      setSearchParams(
        (actuales) => {
          const siguientes = new URLSearchParams(actuales);
          if (nuevoPeriodo === PERIODO_POR_DEFECTO) {
            siguientes.delete('periodo');
          } else {
            siguientes.set('periodo', nuevoPeriodo);
          }
          return siguientes;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  return { periodo, cambiarPeriodo };
}
