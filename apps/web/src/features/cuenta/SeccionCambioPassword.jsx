import { useState } from 'react';
import { MINUTOS_VENCIMIENTO_ENLACE } from '@buscador/shared/constants';
import { passwordChangeFormSchema } from '@buscador/shared/schemas';
import { useSession } from '../../contexts/session/SessionContext.js';
import { useZodForm } from '../../hooks/useZodForm.js';
import { useFormSubmit } from '../../hooks/useFormSubmit.js';
import { Button } from '../../components/ui/Button.jsx';
import { FormError } from '../../components/ui/FormError.jsx';
import { PasswordField } from '../../components/ui/PasswordField.jsx';
import { SuccessMessage } from '../../components/ui/SuccessMessage.jsx';
import { KeyIcon } from '../../components/ui/icons.jsx';
import { SECCIONES_CUENTA } from '../../app/rutas.js';
import { CamposPasswordNueva } from '../auth/CamposPasswordNueva.jsx';
import { solicitarRecuperacion } from '../auth/auth.api.js';
import { cambiarPassword } from './cuenta.api.js';
import { separarErrorPassword } from './separarErrorPassword.js';
import { TarjetaCuenta } from './TarjetaCuenta.jsx';

export function SeccionCambioPassword() {
  const { user } = useSession();
  const { values, field, validate, reset } = useZodForm(passwordChangeFormSchema, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const cambio = useFormSubmit();
  const enlace = useFormSubmit();
  const [actualizada, setActualizada] = useState(false);
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);
  const { errorPassword, errorGeneral } = separarErrorPassword(cambio.error);
  const campoActual = field('currentPassword');

  async function handleSubmit(event) {
    event.preventDefault();
    setActualizada(false);
    const datos = validate(event.currentTarget);
    if (!datos) {
      return;
    }
    const { ok } = await cambio.submit(() => cambiarPassword(datos));
    if (ok) {
      reset();
      setActualizada(true);
    }
  }

  async function handleEnviarEnlace() {
    const { ok } = await enlace.submit(() => solicitarRecuperacion(user.email));
    setEnlaceEnviado(ok);
  }

  return (
    <TarjetaCuenta
      id={SECCIONES_CUENTA.PASSWORD}
      titulo="Contraseña"
      descripcion="Ingresá tu contraseña actual y elegí una nueva."
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <PasswordField
          label="Contraseña actual"
          autoComplete="current-password"
          {...campoActual}
          error={campoActual.error ?? errorPassword}
        />
        <CamposPasswordNueva
          field={field}
          values={values}
          nombre="newPassword"
          etiqueta="Contraseña nueva"
          etiquetaConfirmacion="Repetí la contraseña nueva"
        />

        <FormError>{errorGeneral}</FormError>
        {actualizada && (
          <SuccessMessage>
            Tu contraseña se actualizó. Cerramos la sesión en tus otros dispositivos.
          </SuccessMessage>
        )}

        <Button
          type="submit"
          fullWidth={false}
          loading={cambio.submitting}
          loadingText="Guardando…"
        >
          Cambiar contraseña
        </Button>
      </form>

      <div className="mt-6 space-y-3 border-t border-border pt-5">
        <p className="text-sm leading-relaxed text-muted">
          ¿No recordás tu contraseña actual? Te enviamos un enlace a tu mail para que elijas una
          nueva. El enlace vence a los {MINUTOS_VENCIMIENTO_ENLACE} minutos.
        </p>
        <FormError>{enlace.error?.message}</FormError>
        {enlaceEnviado ? (
          <SuccessMessage>
            Te enviamos el enlace a {user.email}. Revisá también la carpeta de spam.
          </SuccessMessage>
        ) : (
          <Button
            variant="secondary"
            fullWidth={false}
            onClick={handleEnviarEnlace}
            loading={enlace.submitting}
            loadingText="Enviando…"
          >
            <KeyIcon className="size-4" />
            Enviar enlace de restablecimiento
          </Button>
        )}
      </div>
    </TarjetaCuenta>
  );
}
