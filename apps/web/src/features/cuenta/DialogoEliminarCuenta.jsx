import { useNavigate } from 'react-router';
import { accountDeletionSchema } from '@buscador/shared/schemas';
import { useSession } from '../../contexts/session/SessionContext.js';
import { useZodForm } from '../../hooks/useZodForm.js';
import { useFormSubmit } from '../../hooks/useFormSubmit.js';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { DialogActions } from '../../components/ui/DialogActions.jsx';
import { FormError } from '../../components/ui/FormError.jsx';
import { PasswordField } from '../../components/ui/PasswordField.jsx';
import { AlertIcon, TrashIcon } from '../../components/ui/icons.jsx';
import { RUTAS } from '../../app/rutas.js';
import { eliminarCuenta } from './cuenta.api.js';
import { CONSECUENCIAS_ELIMINAR } from './cuenta.constants.js';
import { separarErrorPassword } from './separarErrorPassword.js';

export function DialogoEliminarCuenta({ onCancelar }) {
  const navigate = useNavigate();
  const { reloadSession } = useSession();
  const { field, validate } = useZodForm(accountDeletionSchema, { password: '' });
  const { submitting, error, submit } = useFormSubmit();
  const { errorPassword, errorGeneral } = separarErrorPassword(error);
  const campoPassword = field('password');

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
        <PasswordField
          label="Contraseña actual"
          autoComplete="current-password"
          {...campoPassword}
          error={campoPassword.error ?? errorPassword}
        />

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
