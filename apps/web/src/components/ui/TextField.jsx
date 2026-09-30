import { useId } from 'react';
import { AlertIcon } from './icons.jsx';

/**
 * Campo de texto con label visible, ayuda opcional y error debajo del campo.
 * El error se anuncia a lectores de pantalla y queda asociado al input.
 *
 * @param {{
 *   label: string,
 *   error?: string,
 *   hint?: import('react').ReactNode,
 *   trailing?: import('react').ReactNode,
 * } & import('react').InputHTMLAttributes<HTMLInputElement>} props
 */
export function TextField({ label, error, hint, trailing, id: idProp, ...inputProps }) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hintId = hint ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`block min-h-12 w-full rounded-lg border bg-surface px-3.5 text-base text-foreground transition-colors duration-150 placeholder:text-muted focus:border-primary focus:outline-2 focus:-outline-offset-1 focus:outline-primary ${
            error ? 'border-danger' : 'border-border-strong hover:border-muted'
          } ${trailing ? 'pr-12' : ''}`}
          {...inputProps}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-0.5">{trailing}</div>
        )}
      </div>

      {hint && (
        <div id={hintId} className="text-sm text-muted">
          {hint}
        </div>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-sm font-medium text-danger"
        >
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
