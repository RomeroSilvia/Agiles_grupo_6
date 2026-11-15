import { Outlet } from 'react-router';
import { useSession } from '../../contexts/session/SessionContext.js';
import { SoloConSesion } from '../auth/SoloConSesion.jsx';
import { AccesoDenegado } from './AccesoDenegado.jsx';

function SoloConRolAdmin() {
  const { user } = useSession();

  if (!user.esAdmin) {
    return <AccesoDenegado />;
  }
  return <Outlet />;
}

export function SoloAdmin() {
  return (
    <SoloConSesion fallback={null}>
      <SoloConRolAdmin />
    </SoloConSesion>
  );
}
