import { StarIcon } from '../../components/ui/icons.jsx';
import { formatearPuntuacion } from '../../utils/formatearPuntuacion.js';

export function DatosTitulo({ anio, puntuacion }) {
  const puntuacionFormateada = formatearPuntuacion(puntuacion);

  return (
    <p className="flex items-center gap-1 text-sm text-muted">
      {anio ?? 'Año desconocido'}
      {puntuacionFormateada && (
        <>
          <span aria-hidden="true">·</span>
          <StarIcon className="size-3.5 fill-rating text-rating" />
          {puntuacionFormateada}
        </>
      )}
    </p>
  );
}
