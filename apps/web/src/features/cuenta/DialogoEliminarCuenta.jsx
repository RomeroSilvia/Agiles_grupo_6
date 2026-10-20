import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CONFIRMACION_ELIMINAR } from '@buscador/shared/constants';
import { accountDeletionByTextSchema, passwordConfirmationSchema } from '@buscador/shared/schemas';
import { useSession } from '../../contexts/session/SessionContext.js';
import { useZodForm } from '../../hooks/useZodForm.js';
import { useFormSubmit } from '../../hooks/useFormSubmit.js';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { DialogActions } from '../../components/ui/DialogActions.jsx';
import { FormError } from '../../components/ui/FormError.jsx';
import { PasswordField } from '../../components/ui/PasswordField.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { AlertIcon, TrashIcon } from '../../components/ui/icons.jsx';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { RUTAS } from '../../app/rutas.js';
import { eliminarCuenta } from './cuenta.api.js';
import { CONSECUENCIAS_ELIMINAR } from './cuenta.constants.js';
import { separarErrorPassword } from './separarErrorPassword.js';

export function DialogoEliminarCuenta({ onCancelar }) {
  const navigate = useNavigate();
  const { reloadSession } = useSession();
  const [conPassword, setConPassword] = useState(false);
  const { field, validate } = useZodForm(
    conPassword ? passwordConfirmationSchema : accountDeletionByTextSchema,
    { confirmation: '', password: '' },
  );
  const { submitting, error, submit, clearError } = useFormSubmit();
  const { errorPassword, errorGeneral } = separarErrorPassword(error);
  const campoPassword = field('password');

  function alternarModo() {
    clearError();
    setConPassword((actual) => !actual);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const datos = validate(event.currentTarget);
    if (!datos) {
      return;
    }
    const { ok } = await submit(() => eliminarCuenta(datos));
    if (ok) {
      navigate(RUTAS.BUSQUEDA, { replace: true });
      reloadSession();
    }
  }

  return (
    <Dialog
      open
      onClose={submitting ? () => {} : onCancelar}
      title="¿Eliminar tu cuenta?"
      icon={TrashIcon}
      tone="danger"
    >
      <ul className="space-y-3 text-sm leading-relaxed text-muted">
        {CONSECUENCIAS_ELIMINAR.map((consecuencia) => (
          <li key={consecuencia} className="flex items-start gap-2">
            <AlertIcon className="mt-0.5 size-4 shrink-0 text-danger" />
            {consecuencia}
          </li>
        ))}
      </ul>

      <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-3">
        {conPassword ? (
          <PasswordField
            label="Contraseña actual"
            autoComplete="current-password"
            {...campoPassword}
            error={campoPassword.error ?? errorPassword}
          />
        ) : (
          <TextField
            label={`Para confirmar, escribí ${CONFIRMACION_ELIMINAR}`}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            {...field('confirmation')}
          />
        )}

        <p className="text-sm text-muted">
          {conPassword
            ? `¿Preferís escribir ${CONFIRMACION_ELIMINAR}? `
            : '¿Preferís usar tu contraseña? '}
          <button
            type="button"
            onClick={alternarModo}
            className={`${LINK_CLASS_NAME} cursor-pointer rounded-sm underline`}
          >
            {conPassword ? `Escribir ${CONFIRMACION_ELIMINAR}` : 'Confirmar con mi contraseña'}
          </button>
        </p>

        <FormError>{errorGeneral}</FormError>

        <DialogActions onCancel={onCancelar} cancelDisabled={submitting}>
          <Button
            type="submit"
            variant="danger"
            fullWidth={false}
            className="flex-1"
            loading={submitting}
            loadingText="Eliminando…"
          >
            Eliminar mi cuenta
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
