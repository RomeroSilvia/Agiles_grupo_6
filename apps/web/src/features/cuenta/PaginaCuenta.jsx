import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { BackLink } from '../../components/ui/BackLink.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
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
      <BackLink to={RUTAS.PERFIL}>Volver al perfil</BackLink>
      <PageHeader titulo="Cuenta" />

      <SeccionCambioMail />
      <SeccionCambioPassword />
      <SeccionEliminarCuenta />
    </section>
  );
}
