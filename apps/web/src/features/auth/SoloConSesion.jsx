import { Navigate, Outlet } from 'react-router';
import { useSession } from '../../contexts/session/SessionContext.js';
import { RUTAS } from '../../app/rutas.js';
import { PaginaCargando } from './PaginaCargando.jsx';

export function SoloConSesion() {
  const { user, loading } = useSession();

  if (loading) {
    return <PaginaCargando />;
  }
  if (!user) {
    return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  }
  return <Outlet />;
}
