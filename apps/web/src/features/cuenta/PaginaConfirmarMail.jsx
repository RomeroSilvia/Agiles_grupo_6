import { useEffect, useRef, useState } from 'react';
import { useSession } from '../../contexts/session/SessionContext.js';
import { useLinkToken } from '../../hooks/useLinkToken.js';
import { API_ERROR_CODES } from '../../services/api.service.js';
import { ButtonLink } from '../../components/ui/ButtonLink.jsx';
import { AlertIcon, CheckIcon, SpinnerIcon } from '../../components/ui/icons.jsx';
import { RUTAS, SECCIONES_CUENTA, rutaSeccionCuenta } from '../../app/rutas.js';
import { AuthLayout } from '../auth/AuthLayout.jsx';
import { MensajeAside } from '../auth/MensajeAside.jsx';
import { MensajeAuth } from '../auth/MensajeAuth.jsx';
import { confirmarCambioMail } from './cuenta.api.js';
import { ASIDE_CONFIRMAR_MAIL } from './cuenta.constants.js';

const ESTADOS = Object.freeze({
  CONFIRMANDO: 'confirmando',
  CONFIRMADO: 'confirmado',
  ENLACE_INVALIDO: 'enlaceInvalido',
  ERROR: 'error',
});

export function PaginaConfirmarMail() {
  const token = useLinkToken();
  const { user, reloadSession } = useSession();
  const [estado, setEstado] = useState(token ? ESTADOS.CONFIRMANDO : ESTADOS.ENLACE_INVALIDO);
  const [email, setEmail] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const confirmacionPedida = useRef(false);

  useEffect(() => {
    if (!token || confirmacionPedida.current) {
      return;
    }
    confirmacionPedida.current = true;
    confirmarCambioMail(token)
      .then((data) => {
        setEmail(data.email);
        setEstado(ESTADOS.CONFIRMADO);
        reloadSession();
      })
      .catch((error) => {
        setMensajeError(error.message);
        setEstado(
          error.code === API_ERROR_CODES.INVALID_LINK ? ESTADOS.ENLACE_INVALIDO : ESTADOS.ERROR,
        );
      });
  }, [token, reloadSession]);

  const irACuenta = (
    <ButtonLink to={rutaSeccionCuenta(SECCIONES_CUENTA.MAIL)}>Ir a mi cuenta</ButtonLink>
  );

  function contenido() {
    switch (estado) {
      case ESTADOS.CONFIRMADO:
        return (
          <MensajeAuth
            icono={CheckIcon}
            titulo="Tu mail se actualizó"
            acciones={
              user ? (
                <ButtonLink to={RUTAS.PERFIL}>Ir a mi perfil</ButtonLink>
              ) : (
                <ButtonLink to={RUTAS.INICIAR_SESION}>Iniciar sesión</ButtonLink>
              )
            }
          >
            <p>
              Desde ahora iniciás sesión con <strong className="text-foreground">{email}</strong>.
              Le avisamos del cambio a tu mail anterior.
            </p>
          </MensajeAuth>
        );
      case ESTADOS.ENLACE_INVALIDO:
        return (
          <MensajeAuth
            icono={AlertIcon}
            tono="danger"
            titulo="El enlace venció o ya se usó"
            acciones={irACuenta}
          >
            <p>Tu mail no cambió. Pedí el cambio de nuevo desde tu cuenta.</p>
          </MensajeAuth>
        );
      case ESTADOS.ERROR:
        return (
          <MensajeAuth
            icono={AlertIcon}
            tono="danger"
            titulo="No pudimos confirmar tu mail"
            acciones={irACuenta}
          >
            <p>{mensajeError}</p>
          </MensajeAuth>
        );
      default:
        return (
          <p role="status" className="flex items-center gap-3 text-muted">
            <SpinnerIcon />
            Confirmando tu nuevo mail…
          </p>
        );
    }
  }

  return <AuthLayout aside={<MensajeAside {...ASIDE_CONFIRMAR_MAIL} />}>{contenido()}</AuthLayout>;
}
