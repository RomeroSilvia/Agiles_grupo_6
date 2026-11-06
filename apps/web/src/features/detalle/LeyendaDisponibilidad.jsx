export function LeyendaDisponibilidad() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-3.5 rounded bg-primary" />
        <span>A color: está en tus plataformas</span>
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-3.5 rounded bg-plataforma-inactiva" />
        <span>Gris: no la tenés</span>
      </li>
    </ul>
  );
}
