import { useState } from 'react';
import { emailChangeFormSchema } from '@buscador/shared/schemas';
import { useSession } from '../../contexts/session/SessionContext.js';
import { useZodForm } from '../../hooks/useZodForm.js';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { MailCheckIcon } from '../../components/ui/icons.jsx';
import { SECCIONES_CUENTA } from '../../app/rutas.js';
import { DialogoConfirmarIdentidad } from './DialogoConfirmarIdentidad.jsx';
import { TarjetaCuenta } from './TarjetaCuenta.jsx';

const PASOS = Object.freeze({ IDENTIDAD: 'identidad', ENVIADO: 'enviado' });

export function SeccionCambioMail() {
  const { user } = useSession();
  const { field, validate, reset } = useZodForm(emailChangeFormSchema, { email: '' });
  const [paso, setPaso] = useState(null);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [errorMail, setErrorMail] = useState('');
  const campoMail = field('email');

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMail('');
    const datos = validate(event.currentTarget);
    if (!datos) {
      return;
    }
    setNuevoEmail(datos.email);
    setPaso(PASOS.IDENTIDAD);
  }

  function handleEnviado() {
    reset();
    setPaso(PASOS.ENVIADO);
  }

  function handleMailRechazado(mensaje) {
    setErrorMail(mensaje);
    setPaso(null);
  }

  const cerrar = () => setPaso(null);

  return (
    <TarjetaCuenta
      id={SECCIONES_CUENTA.MAIL}
      titulo="Mail"
      descripcion={
        <p>
          Mail actual: <strong className="break-all text-foreground">{user.email}</strong>
        </p>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nuevo mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nuevo@mail.com"
          hint="Te enviamos un enlace de confirmación al nuevo mail. Tu mail actual no cambia hasta que lo confirmes."
          {...campoMail}
          onChange={(event) => {
            setErrorMail('');
            campoMail.onChange(event);
          }}
          error={campoMail.error ?? (errorMail || undefined)}
        />
        <Button type="submit" fullWidth={false}>
          Cambiar mail
        </Button>
      </form>

      {paso === PASOS.IDENTIDAD && (
        <DialogoConfirmarIdentidad
          nuevoEmail={nuevoEmail}
          onCancelar={cerrar}
          onEnviado={handleEnviado}
          onMailRechazado={handleMailRechazado}
        />
      )}

      <Dialog
        open={paso === PASOS.ENVIADO}
        onClose={cerrar}
        title="Revisá tu nuevo mail"
        icon={MailCheckIcon}
      >
        <p className="leading-relaxed text-muted">
          Te enviamos un enlace a <strong className="text-foreground">{nuevoEmail}</strong>. Tu mail
          sigue siendo <strong className="text-foreground">{user.email}</strong> hasta que lo
          confirmes. Cuando lo hagas, avisamos al mail anterior.
        </p>
        <Button className="mt-6" onClick={cerrar}>
          Entendido
        </Button>
      </Dialog>
    </TarjetaCuenta>
  );
}
