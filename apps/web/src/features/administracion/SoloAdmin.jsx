import { Outlet } from 'react-router';
import { useSession } from '../../contexts/session/SessionContext.js';
import { AccesoDenegado } from './AccesoDenegado.jsx';

// Va adentro de SoloConSesion, que ya resuelve la carga de la sesión y la redirección al ingreso
export function SoloAdmin() {
  const { user } = useSession();

  if (!user?.esAdmin) {
    return <AccesoDenegado />;
  }
  return <Outlet />;
}
