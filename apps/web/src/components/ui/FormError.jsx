import { Alert } from './Alert.jsx';

/** Error general del formulario (el que devuelve la API), arriba del botón de envío. */
export function FormError({ children }) {
  if (!children) {
    return null;
  }
  return <Alert>{children}</Alert>;
}
