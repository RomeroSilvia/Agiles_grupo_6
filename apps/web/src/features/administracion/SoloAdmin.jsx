import { Outlet } from 'react-router';
import { useSession } from '../../contexts/session/SessionContext.js';
import { AccesoDenegado } from './AccesoDenegado.jsx';

export function SoloAdmin() {
  const { user } = useSession();

  if (!user?.esAdmin) {
    return <AccesoDenegado />;
  }
  return <Outlet />;
}
