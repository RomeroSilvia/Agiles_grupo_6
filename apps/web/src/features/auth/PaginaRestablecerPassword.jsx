import { useState } from 'react';
import { MINUTOS_VENCIMIENTO_ENLACE } from '@buscador/shared/constants';
import { passwordResetFormSchema } from '@buscador/shared/schemas';
import { useSession } from '../../contexts/session/SessionContext.js';
import { useZodForm } from '../../hooks/useZodForm.js';
import { useFormSubmit } from '../../hooks/useFormSubmit.js';
import { useLinkToken } from '../../hooks/useLinkToken.js';
import { API_ERROR_CODES } from '../../services/api.service.js';
import { Button } from '../../components/ui/Button.jsx';
import { ButtonLink } from '../../components/ui/ButtonLink.jsx';
import { FormError } from '../../components/ui/FormError.jsx';
import { CheckIcon } from '../../components/ui/icons.jsx';
import { RUTAS } from '../../app/rutas.js';
import { AuthLayout } from './AuthLayout.jsx';
import { CamposPasswordNueva } from './CamposPasswordNueva.jsx';
import { EnlaceVencido } from './EnlaceVencido.jsx';
import { MensajeAside } from './MensajeAside.jsx';
import { MensajeAuth } from './MensajeAuth.jsx';
import { restablecerPassword } from './auth.api.js';
import { ASIDE_PASSWORD_NUEVA, ASIDE_RECUPERAR } from './auth.constants.js';

export function PaginaRestablecerPassword() {
  const token = useLinkToken();
  const { reloadSession } = useSession();
  const { values, field, validate } = useZodForm(passwordResetFormSchema, {
    password: '',
    confirmPassword: '',
  });
  const { submitting, error, submit } = useFormSubmit();
  const [actualizada, setActualizada] = useState(false);

  const enlaceInvalido = !token || error?.code === API_ERROR_CODES.INVALID_LINK;

  async function handleSubmit(event) {
    event.preventDefault();
    const datos = validate(event.currentTarget);
    if (!datos) {
      return;
    }
    const { ok } = await submit(() => restablecerPassword({ token, password: datos.password }));
    if (ok) {
      setActualizada(true);
      reloadSession();
    }
  }

  function contenido() {
    if (enlaceInvalido) {
      return <EnlaceVencido />;
    }
    if (actualizada) {
      return (
        <MensajeAuth
          icono={CheckIcon}
          titulo="Tu contraseña se actualizó"
          acciones={<ButtonLink to={RUTAS.INICIAR_SESION}>Iniciar sesión</ButtonLink>}
        >
          <p>
            Ya podés iniciar sesión con tu contraseña nueva. Por seguridad, cerramos la sesión en
            todos tus dispositivos.
          </p>
        </MensajeAuth>
      );
    }
    return (
      <>
        <h1 className="text-3xl font-extrabold tracking-tight">Contraseña nueva</h1>
        <p className="mt-2 text-muted">
          Este enlace vence a los {MINUTOS_VENCIMIENTO_ENLACE} minutos desde que lo pediste y se usa
          una sola vez.
        </p>

        <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-5">
          <CamposPasswordNueva
            field={field}
            values={values}
            etiqueta="Contraseña nueva"
            etiquetaConfirmacion="Repetí la contraseña nueva"
          />

          <FormError>{error?.message}</FormError>

          <Button type="submit" loading={submitting} loadingText="Guardando…">
            Guardar contraseña
          </Button>
        </form>
      </>
    );
  }

  return (
    <AuthLayout
      aside={<MensajeAside {...(enlaceInvalido ? ASIDE_RECUPERAR : ASIDE_PASSWORD_NUEVA)} />}
    >
      {contenido()}
    </AuthLayout>
  );
}
