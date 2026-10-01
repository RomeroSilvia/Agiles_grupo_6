import { Navigate, Outlet } from 'react-router';
import { useSession } from '../../contexts/session/SessionContext.js';

/** Rutas de ingreso y registro: si ya hay sesión iniciada, lleva al inicio. */
export function SoloSinSesion() {
  const { user, loading } = useSession();

  if (loading) {
    return null;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
