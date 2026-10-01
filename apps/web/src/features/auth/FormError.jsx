import { AlertIcon } from '../../components/ui/icons.jsx';

/** Error general del formulario (el que devuelve la API), arriba del botón de envío. */
export function FormError({ children }) {
  if (!children) {
    return null;
  }
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-surface p-3 text-sm font-medium text-danger"
    >
      <AlertIcon className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
