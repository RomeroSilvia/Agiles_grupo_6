import { Navigate, Outlet } from 'react-router';
import { useSession } from '../../contexts/session/SessionContext.js';
import { RUTAS } from '../../app/rutas.js';

export function SoloConSesion() {
  const { user, loading } = useSession();

  if (loading) {
    return null;
  }
  if (!user) {
    return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  }
  return <Outlet />;
}
