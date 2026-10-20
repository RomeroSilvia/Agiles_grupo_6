import { SpinnerIcon } from './icons.jsx';
import { buttonClassName } from './buttonClassName.js';

/**
 * Botón de acción principal. Mientras `loading` está activo queda deshabilitado
 * y muestra `loadingText` para que no se envíe dos veces.
 *
 * @param {{ variant?: 'primary' | 'accent' | 'secondary' | 'danger' | 'dangerOutline', fullWidth?: boolean, loading?: boolean, loadingText?: string } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({
  variant,
  fullWidth,
  loading = false,
  loadingText,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, fullWidth, className })}
      {...props}
    >
      {loading && <SpinnerIcon />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
