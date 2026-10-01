import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { signInSchema } from '@buscador/shared/schemas';
import { useSession } from '../../contexts/session/SessionContext.js';
import { useZodForm } from '../../hooks/useZodForm.js';
import { Button } from '../../components/ui/Button.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { PasswordField } from '../../components/ui/PasswordField.jsx';
import { AuthLayout } from './AuthLayout.jsx';
import { FormError } from './FormError.jsx';

const linkClassName =
  'rounded-sm font-semibold text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

/** E4HU2: inicio de sesión con mail y contraseña. */
export function PaginaInicioSesion() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const { field, validate } = useZodForm(signInSchema, { email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const credenciales = validate(event.currentTarget);
    if (!credenciales) {
      return;
    }

    setSubmitting(true);
    try {
      await signIn(credenciales);
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      aside={
        <>
          <p className="text-5xl leading-[1.05] font-extrabold tracking-tight text-balance xl:text-6xl">
            Una búsqueda. Todas tus plataformas.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-panel-muted">
            Iniciá sesión para filtrar por tus plataformas propias, guardar tu watchlist y recibir
            avisos de disponibilidad.
          </p>
        </>
      }
    >
      <h1 className="text-3xl font-extrabold tracking-tight">Iniciar sesión</h1>
      <p className="mt-2 text-muted">Accedé a tu cuenta para seguir donde dejaste.</p>

      <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-5">
        <TextField
          label="Mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="vos@mail.com"
          {...field('email')}
        />
        <PasswordField label="Contraseña" autoComplete="current-password" {...field('password')} />

        <FormError>{formError}</FormError>

        <Button type="submit" loading={submitting} loadingText="Ingresando…">
          Ingresar
        </Button>
      </form>

      <p className="mt-8 text-center text-muted">
        ¿No tenés cuenta?{' '}
        <Link to="/registro" className={linkClassName}>
          Registrate
        </Link>
      </p>
    </AuthLayout>
  );
}
