const FORMATEADOR = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeZone: 'UTC' });

export function FechaEstrenoCine({ pelicula }) {
  return pelicula.fechaEstrenoAr ? (
    <time dateTime={pelicula.fechaEstrenoAr}>
      Estreno en Argentina: {FORMATEADOR.format(new Date(`${pelicula.fechaEstrenoAr}T12:00:00Z`))}
    </time>
  ) : (
    <span>Fecha pendiente de confirmación. Sin fecha, fuera del período fechado.</span>
  );
}
