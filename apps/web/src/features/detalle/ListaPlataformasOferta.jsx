import { TarjetaDisponibilidad } from './TarjetaDisponibilidad.jsx';

export function ListaPlataformasOferta({
  plataformas,
  nombreTitulo,
  etiqueta,
  size,
  mostrarIdiomas = false,
}) {
  if (!mostrarIdiomas) {
    return (
      <ul className="flex flex-wrap gap-3" aria-label={etiqueta}>
        {plataformas.map(({ plataforma, esPropia }) => (
          <li key={plataforma.id}>
            <TarjetaDisponibilidad
              plataforma={plataforma}
              esPropia={esPropia}
              nombreTitulo={nombreTitulo}
              size={size}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2" aria-label={etiqueta}>
      {plataformas.map(({ plataforma, esPropia }) => {
        const audios = Array.isArray(plataforma.audios) ? plataforma.audios : [];
        const subtitulos = Array.isArray(plataforma.subtitulos) ? plataforma.subtitulos : [];
        const tieneIdiomas = audios.length > 0 || subtitulos.length > 0;

        return (
          <li
            key={plataforma.id}
            className="flex items-start gap-3 rounded-field border border-border bg-surface p-3"
          >
            <TarjetaDisponibilidad
              plataforma={plataforma}
              esPropia={esPropia}
              nombreTitulo={nombreTitulo}
              size={size}
              mostrarNombreOculto={false}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-sm font-semibold text-foreground">{plataforma.nombre}</p>
              {tieneIdiomas ? (
                <dl className="space-y-0.5 text-xs">
                  <div className="flex flex-wrap gap-x-1.5">
                    <dt className="font-medium text-foreground">Audio:</dt>
                    <dd className="text-muted">
                      {audios.length > 0 ? audios.join(', ') : 'No disponible'}
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-x-1.5">
                    <dt className="font-medium text-foreground">Subtítulos:</dt>
                    <dd className="text-muted">
                      {subtitulos.length > 0 ? subtitulos.join(', ') : 'No disponibles'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-xs text-muted">Idiomas no disponibles</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
