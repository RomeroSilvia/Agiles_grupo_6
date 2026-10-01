import { PASSWORD_REQUIREMENTS } from '@buscador/shared/schemas';
import { CheckIcon, CircleIcon } from '../../components/ui/icons.jsx';

/**
 * Criterios de seguridad de la contraseña, marcados a medida que se cumplen
 * (E4HU2, escenario 3). Además del color cambia el ícono y el texto para lectores de pantalla.
 */
export function PasswordRequirements({ password }) {
  return (
    <ul
      aria-label="Requisitos de la contraseña"
      className="grid gap-x-4 gap-y-1 pt-0.5 sm:grid-cols-2"
    >
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const cumplido = requirement.pattern.test(password);
        return (
          <li
            key={requirement.id}
            className={`flex items-center gap-1.5 transition-colors duration-150 ${
              cumplido ? 'text-success' : 'text-muted'
            }`}
          >
            {cumplido ? (
              <CheckIcon className="size-4 shrink-0" />
            ) : (
              <CircleIcon className="size-4 shrink-0" />
            )}
            <span>
              {requirement.label}
              <span className="sr-only">{cumplido ? ' (cumplido)' : ' (pendiente)'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
