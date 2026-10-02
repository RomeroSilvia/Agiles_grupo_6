import { Navigate, Outlet } from 'react-router';
import { useSession } from '../../contexts/session/SessionContext.js';

export function SoloConSesion() {
  const { user, loading } = useSession();

  if (loading) {
    return null;
  }
  if (!user) {
    return <Navigate to="/iniciar-sesion" replace />;
  }
  return <Outlet />;
}
