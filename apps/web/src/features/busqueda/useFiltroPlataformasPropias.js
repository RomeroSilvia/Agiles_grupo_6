import { useSession } from '../../contexts/session/SessionContext.js';
import { usePlataformasPropias } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';

export function useFiltroPlataformasPropias() {
  const { user, loading: cargandoSesion } = useSession();
  const { seleccionadas, loading: cargandoPropias, error } = usePlataformasPropias();

  const visible = Boolean(user);
  const resuelto = !cargandoSesion && !cargandoPropias;
  const tienePlataformas = seleccionadas.size > 0;

  return {
    visible,
    resuelto,
    error: visible && resuelto ? error : '',
    sinPlataformas: visible && resuelto && !error && !tienePlataformas,
    disponible: visible && resuelto && !error && tienePlataformas,
  };
}
