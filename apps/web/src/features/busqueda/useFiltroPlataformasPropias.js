import { useMemo } from 'react';
import { useSession } from '../../contexts/session/SessionContext.js';
import { usePlataformasPropias } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';

export function useFiltroPlataformasPropias() {
  const { user, loading: cargandoSesion } = useSession();
  const { seleccionadas, loading: cargandoPropias, error } = usePlataformasPropias();

  const visible = Boolean(user);
  const resuelto = !cargandoSesion && !cargandoPropias;
  const tienePlataformas = seleccionadas.size > 0;
  const firma = useMemo(() => [...seleccionadas].sort((a, b) => a - b).join(','), [seleccionadas]);

  return {
    visible,
    resuelto,
    firma,
    error: visible && resuelto ? error : '',
    sinPlataformas: visible && resuelto && !error && !tienePlataformas,
    disponible: visible && resuelto && !error && tienePlataformas,
  };
}
