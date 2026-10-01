import { SpinnerIcon } from './icons.jsx';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  accent: 'bg-accent text-accent-foreground hover:bg-accent-hover',
};

/**
 * Botón de acción principal. Mientras `loading` está activo queda deshabilitado
 * y muestra `loadingText` para que no se envíe dos veces.
 *
 * @param {{ variant?: 'primary' | 'accent', loading?: boolean, loadingText?: string } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({
  variant = 'primary',
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
      className={`inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <SpinnerIcon />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
