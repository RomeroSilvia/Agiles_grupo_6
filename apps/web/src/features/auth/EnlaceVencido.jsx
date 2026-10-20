import { Link } from 'react-router';
import { MINUTOS_VENCIMIENTO_ENLACE } from '@buscador/shared/constants';
import { ButtonLink } from '../../components/ui/ButtonLink.jsx';
import { AlertIcon } from '../../components/ui/icons.jsx';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { RUTAS } from '../../app/rutas.js';
import { MensajeAuth } from './MensajeAuth.jsx';

export function EnlaceVencido() {
  return (
    <MensajeAuth
      icono={AlertIcon}
      tono="danger"
      titulo="El enlace venció o ya se usó"
      acciones={
        <>
          <ButtonLink to={RUTAS.RECUPERAR_PASSWORD}>Pedir otro enlace</ButtonLink>
          <Link
            to={RUTAS.INICIAR_SESION}
            className={`${LINK_CLASS_NAME} inline-block rounded-sm text-sm hover:underline`}
          >
            Volver a iniciar sesión
          </Link>
        </>
      }
    >
      <p>
        Por seguridad, los enlaces para restablecer la contraseña duran {MINUTOS_VENCIMIENTO_ENLACE}{' '}
        minutos y sirven una sola vez. Tu contraseña no cambió: pedí otro enlace para continuar.
      </p>
    </MensajeAuth>
  );
}
