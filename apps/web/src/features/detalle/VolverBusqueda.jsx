import { Link, useLocation, useNavigate } from 'react-router';
import { RUTAS } from '../../app/rutas.js';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';

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
    <Link
      to={RUTAS.BUSQUEDA}
      onClick={volver}
      className={`${LINK_CLASS_NAME} rounded-sm underline`}
    >
      Volver a la búsqueda
    </Link>
  );
}
