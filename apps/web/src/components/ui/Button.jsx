import { SpinnerIcon } from './icons.jsx';
import { buttonClassName } from './buttonClassName.js';

/**
 * Botón de acción. Mientras `loading` está activo queda deshabilitado
 * y muestra `loadingText` para que no se envíe dos veces.
 * Para cambiar el ancho o el tamaño usar `fullWidth` y `size`, no clases en `className`:
 * dos clases de Tailwind que se contradicen no se pisan por el orden en que se escriben.
 *
 * @param {{ variant?: 'primary' | 'accent' | 'secondary' | 'outline' | 'outlineDanger' | 'danger', size?: 'md' | 'compact' | 'sm', fullWidth?: boolean, loading?: boolean, loadingText?: string } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({
  variant,
  size,
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
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading && <SpinnerIcon />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
