import { MENSAJE_SIN_DATOS } from './administracion.constants.js';

export function SinDatosRanking() {
  return (
    <p role="status" className="py-6 text-center text-sm text-muted">
      {MENSAJE_SIN_DATOS}
    </p>
  );
}
