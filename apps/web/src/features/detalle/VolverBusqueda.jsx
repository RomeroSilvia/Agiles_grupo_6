import { Link, useLocation, useNavigate } from 'react-router';
import { RUTAS } from '../../app/rutas.js';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';

const LINK_CLASS_NAME = `rounded-sm font-semibold text-link underline underline-offset-4 ${FOCUS_RING_CLASS_NAME}`;

export function VolverBusqueda() {
  const location = useLocation();
  const navigate = useNavigate();

  function volver(event) {
    if (location.state?.desdeBusqueda) {
      event.preventDefault();
      navigate(-1);
    }
  }

  return (
    <Link to={RUTAS.BUSQUEDA} onClick={volver} className={LINK_CLASS_NAME}>
      Volver a la búsqueda
    </Link>
  );
}
