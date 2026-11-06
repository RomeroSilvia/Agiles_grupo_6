import { usePlataformasPropias } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';
import { useSession } from '../../contexts/session/SessionContext.js';

/**
 * Indica si se puede separar lo propio de lo ajeno. Si la selección no se pudo cargar,
 * no se sabe qué tiene el usuario y ninguna plataforma se trata como ajena.
 */
export function useDistincionPropias() {
  const { user, loading: cargandoSesion } = useSession();
  const { seleccionadas, loading: cargandoPropias, error } = usePlataformasPropias();

  return {
    seleccionadas,
    distinguirPropias: Boolean(user) && !cargandoSesion && !cargandoPropias && !error,
  };
}
