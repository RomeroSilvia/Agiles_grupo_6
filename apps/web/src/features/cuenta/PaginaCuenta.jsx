import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { RUTAS } from '../../app/rutas.js';
import { SeccionCambioMail } from './SeccionCambioMail.jsx';
import { SeccionCambioPassword } from './SeccionCambioPassword.jsx';
import { SeccionEliminarCuenta } from './SeccionEliminarCuenta.jsx';

export function PaginaCuenta() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView?.();
    }
  }, [hash]);

  return (
    <section className="max-w-2xl space-y-6">
      <Link to={RUTAS.PERFIL} className={`${LINK_CLASS_NAME} inline-block rounded-sm underline`}>
        Volver al perfil
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">Cuenta</h1>

      <SeccionCambioMail />
      <SeccionCambioPassword />
      <SeccionEliminarCuenta />
    </section>
  );
}
