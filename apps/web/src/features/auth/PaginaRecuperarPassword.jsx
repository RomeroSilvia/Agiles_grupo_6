import { useState } from 'react';
import { Link } from 'react-router';
import { MINUTOS_VENCIMIENTO_ENLACE } from '@buscador/shared/constants';
import { passwordRecoverySchema } from '@buscador/shared/schemas';
import { useZodForm } from '../../hooks/useZodForm.js';
import { useFormSubmit } from '../../hooks/useFormSubmit.js';
import { Button } from '../../components/ui/Button.jsx';
import { ButtonLink } from '../../components/ui/ButtonLink.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { FormError } from '../../components/ui/FormError.jsx';
import { ChevronLeftIcon, MailCheckIcon } from '../../components/ui/icons.jsx';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { RUTAS } from '../../app/rutas.js';
import { AuthLayout } from './AuthLayout.jsx';
import { MensajeAside } from './MensajeAside.jsx';
import { MensajeAuth } from './MensajeAuth.jsx';
import { solicitarRecuperacion } from './auth.api.js';
import { ASIDE_RECUPERAR } from './auth.constants.js';

export function PaginaRecuperarPassword() {
  const { field, validate } = useZodForm(passwordRecoverySchema, { email: '' });
  const { submitting, error, submit } = useFormSubmit();
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const datos = validate(event.currentTarget);
    if (!datos) {
      return;
    }
    const { ok } = await submit(() => solicitarRecuperacion(datos.email));
    setEnviado(ok);
  }

  return (
    <AuthLayout aside={<MensajeAside {...ASIDE_RECUPERAR} />}>
      {enviado ? (
        <MensajeAuth
          icono={MailCheckIcon}
          titulo="Revisá tu mail"
          acciones={
            <>
              <ButtonLink to={RUTAS.INICIAR_SESION}>Volver a iniciar sesión</ButtonLink>
              <p className="text-sm text-muted">
                ¿No te llegó? Revisá la carpeta de spam o{' '}
                <button
                  type="button"
                  onClick={() => setEnviado(false)}
                  className={`${LINK_CLASS_NAME} cursor-pointer rounded-sm underline`}
                >
                  pedí otro enlace
                </button>
                .
              </p>
            </>
          }
        >
          <p>
            Si el mail ingresado corresponde a una cuenta, te enviamos un enlace para restablecer tu
            contraseña. El enlace vence a los {MINUTOS_VENCIMIENTO_ENLACE} minutos.
          </p>
        </MensajeAuth>
      ) : (
        <>
          <Link
            to={RUTAS.INICIAR_SESION}
            className={`${LINK_CLASS_NAME} inline-flex items-center gap-1 rounded-sm text-sm hover:underline`}
          >
            <ChevronLeftIcon className="size-4" />
            Volver a iniciar sesión
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Recuperar contraseña</h1>
          <p className="mt-2 text-muted">
            Ingresá tu mail y te enviamos un enlace para elegir una contraseña nueva.
          </p>

          <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-5">
            <TextField
              label="Mail"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="vos@mail.com"
              {...field('email')}
            />

            <FormError>{error?.message}</FormError>

            <Button type="submit" loading={submitting} loadingText="Enviando…">
              Enviar enlace
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
