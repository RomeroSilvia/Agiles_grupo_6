import { formatearFechaCine } from './fechasCine.js';

export function FechaEstrenoCine({
  pelicula,
  pendiente = 'Fecha pendiente de confirmación. Sin fecha, fuera del período fechado.',
}) {
  return pelicula.fechaEstrenoAr ? (
    <time dateTime={pelicula.fechaEstrenoAr}>
      Estreno en Argentina: {formatearFechaCine(pelicula.fechaEstrenoAr)}
    </time>
  ) : (
    <span>{pendiente}</span>
  );
}
