import { useLocation, useNavigate } from 'react-router';
import { RUTAS } from '../../app/rutas.js';
import { BackLink } from '../../components/ui/BackLink.jsx';

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
    <BackLink to={RUTAS.BUSQUEDA} onClick={volver}>
      Volver a la búsqueda
    </BackLink>
  );
}
