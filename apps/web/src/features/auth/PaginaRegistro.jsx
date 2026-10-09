import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { signUpFormSchema } from '@buscador/shared/schemas';
import { useSession } from '../../contexts/session/SessionContext.js';
import { useZodForm } from '../../hooks/useZodForm.js';
import { Button } from '../../components/ui/Button.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { PasswordField } from '../../components/ui/PasswordField.jsx';
import { CheckIcon } from '../../components/ui/icons.jsx';
import { AuthLayout } from './AuthLayout.jsx';
import { FormError } from '../../components/ui/FormError.jsx';
import { PasswordRequirements } from './PasswordRequirements.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { RUTAS } from '../../app/rutas.js';

const BENEFICIOS = [
  'Búsqueda ilimitada y disponibilidad por región',
  'Filtro por tus plataformas propias',
  'Redireccionamiento directo a la plataforma',
];

const linkClassName = `rounded-sm font-semibold text-link underline-offset-4 hover:underline ${FOCUS_RING_CLASS_NAME}`;

/** E4HU2: registro con mail y contraseña. Al terminar deja la sesión iniciada. */
export function PaginaRegistro() {
  const { signUp } = useSession();
  const navigate = useNavigate();
  const { values, field, validate } = useZodForm(signUpFormSchema, {
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const datos = validate(event.currentTarget);
    if (!datos) {
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ email: datos.email, password: datos.password });
      navigate(RUTAS.BUSQUEDA, { replace: true });
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
            Gratis, para empezar hoy
          </p>
          <ul className="mt-8 space-y-4 text-lg">
            {BENEFICIOS.map((beneficio) => (
              <li key={beneficio} className="flex items-start gap-3">
                <CheckIcon className="mt-1 size-5 shrink-0 text-panel-accent" />
                {beneficio}
              </li>
            ))}
          </ul>
        </>
      }
    >
      <h1 className="text-3xl font-extrabold tracking-tight">Creá tu cuenta</h1>
      <p className="mt-2 text-muted">Tarda menos de un minuto.</p>

      <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-5">
        <TextField
          label="Mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="vos@mail.com"
          {...field('email')}
        />
        <PasswordField
          label="Contraseña"
          autoComplete="new-password"
          hint={<PasswordRequirements password={values.password} />}
          {...field('password')}
        />
        <PasswordField
          label="Repetí la contraseña"
          autoComplete="new-password"
          {...field('confirmPassword')}
        />

        <FormError>{formError}</FormError>

        <Button type="submit" variant="accent" loading={submitting} loadingText="Creando cuenta…">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-8 text-center text-muted">
        ¿Ya tenés cuenta?{' '}
        <Link to={RUTAS.INICIAR_SESION} className={linkClassName}>
          Iniciá sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
