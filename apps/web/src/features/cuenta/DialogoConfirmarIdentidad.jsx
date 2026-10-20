import { passwordConfirmationSchema } from '@buscador/shared/schemas';
import { useZodForm } from '../../hooks/useZodForm.js';
import { useFormSubmit } from '../../hooks/useFormSubmit.js';
import { API_ERROR_CODES } from '../../services/api.service.js';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { DialogActions } from '../../components/ui/DialogActions.jsx';
import { FormError } from '../../components/ui/FormError.jsx';
import { PasswordField } from '../../components/ui/PasswordField.jsx';
import { LockIcon } from '../../components/ui/icons.jsx';
import { solicitarCambioMail } from './cuenta.api.js';
import { separarErrorPassword } from './separarErrorPassword.js';

export function DialogoConfirmarIdentidad({ nuevoEmail, onCancelar, onEnviado, onMailRechazado }) {
  const { field, validate } = useZodForm(passwordConfirmationSchema, { password: '' });
  const { submitting, error, submit } = useFormSubmit();
  const { errorPassword, errorGeneral } = separarErrorPassword(error);
  const campoPassword = field('password');

  async function handleSubmit(event) {
    event.preventDefault();
    const datos = validate(event.currentTarget);
    if (!datos) {
      return;
    }
    const resultado = await submit(() =>
      solicitarCambioMail({ email: nuevoEmail, password: datos.password }),
    );
    if (resultado.ok) {
      onEnviado();
    } else if (resultado.error.code === API_ERROR_CODES.CONFLICT) {
      onMailRechazado(resultado.error.message);
    }
  }

  return (
    <Dialog
      open
      onClose={submitting ? () => {} : onCancelar}
      title="Confirmá tu identidad"
      icon={LockIcon}
    >
      <p className="leading-relaxed text-muted">
        Vas a cambiar tu mail a <strong className="text-foreground">{nuevoEmail}</strong>. Ingresá
        tu contraseña actual para continuar.
      </p>

      <form noValidate onSubmit={handleSubmit} className="mt-5">
        <PasswordField
          label="Contraseña actual"
          autoComplete="current-password"
          {...campoPassword}
          error={campoPassword.error ?? errorPassword}
        />
        <div className="mt-4">
          <FormError>{errorGeneral}</FormError>
        </div>
        <DialogActions onCancel={onCancelar} cancelDisabled={submitting}>
          <Button
            type="submit"
            fullWidth={false}
            className="flex-1"
            loading={submitting}
            loadingText="Enviando…"
          >
            Enviar enlace
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
