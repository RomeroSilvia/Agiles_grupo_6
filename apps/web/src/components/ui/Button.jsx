import { SpinnerIcon } from './icons.jsx';
import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  accent: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  outline: 'border border-primary text-primary hover:bg-primary/10',
  outlineDanger: 'border border-danger text-danger hover:bg-danger/10',
};

const SIZES = {
  md: 'min-h-12 rounded-lg px-5',
  compact: 'rounded-xl px-5 py-3',
  sm: 'rounded-xl px-4 py-2',
};

/**
 * Botón de acción. Mientras `loading` está activo queda deshabilitado
 * y muestra `loadingText` para que no se envíe dos veces.
 * Para cambiar el ancho o el tamaño usar `fullWidth` y `size`, no clases en `className`:
 * dos clases de Tailwind que se contradicen no se pisan por el orden en que se escriben.
 *
 * @param {{ variant?: 'primary' | 'accent' | 'outline' | 'outlineDanger', size?: 'md' | 'compact' | 'sm', fullWidth?: boolean, loading?: boolean, loadingText?: string } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  loading = false,
  loadingText,
  disabled,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 text-base font-semibold transition-colors duration-150 ${FOCUS_RING_CLASS_NAME} active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${fullWidth ? 'w-full' : ''} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <SpinnerIcon />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
