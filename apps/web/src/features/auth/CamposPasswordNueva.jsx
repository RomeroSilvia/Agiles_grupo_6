import { PasswordField } from '../../components/ui/PasswordField.jsx';
import { PasswordRequirements } from './PasswordRequirements.jsx';

export function CamposPasswordNueva({
  field,
  values,
  nombre = 'password',
  etiqueta = 'Contraseña',
  etiquetaConfirmacion = 'Repetí la contraseña',
}) {
  return (
    <>
      <PasswordField
        label={etiqueta}
        autoComplete="new-password"
        hint={<PasswordRequirements password={values[nombre]} />}
        {...field(nombre)}
      />
      <PasswordField
        label={etiquetaConfirmacion}
        autoComplete="new-password"
        {...field('confirmPassword')}
      />
    </>
  );
}
