import { FOCUS_RING_CLASS_NAME } from './focusRing.js';

/** Botón con aspecto de enlace. Hereda el color del texto, por ejemplo el rojo de un aviso de error. */
export function TextButton({ className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`cursor-pointer font-semibold underline underline-offset-4 hover:opacity-80 ${FOCUS_RING_CLASS_NAME} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
