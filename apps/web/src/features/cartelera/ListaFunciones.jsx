import { Card } from '../../components/ui/Card.jsx';

export function ListaFunciones({ cines, funciones, renderAccion }) {
  return (
    <div className="space-y-5">
      {[...cines]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-AR') || a.id.localeCompare(b.id))
        .map((cine) => {
          const horarios = funciones.filter((funcion) => funcion.cineId === cine.id);
          const fechas = [...new Set(horarios.map((funcion) => funcion.fechaLocal))].sort();
          if (!horarios.length) return null;
          return (
            <Card as="article" key={cine.id} padding="lg" className="space-y-4">
              <div>
                <h3 className="font-bold">{cine.nombre}</h3>
                {cine.direccion && <p className="text-sm text-muted">{cine.direccion}</p>}
                <p className="text-xs text-muted">Zona horaria: {cine.zonaHoraria}</p>
              </div>
              {fechas.map((fecha) => (
                <section key={fecha} aria-label={`Funciones del ${fecha}`} className="space-y-2">
                  <h4 className="font-semibold">
                    <time dateTime={fecha}>{fecha}</time>
                  </h4>
                  <ul className="space-y-3">
                    {horarios
                      .filter((funcion) => funcion.fechaLocal === fecha)
                      .sort(
                        (a, b) =>
                          a.horaLocal.localeCompare(b.horaLocal) || a.id.localeCompare(b.id),
                      )
                      .map((funcion) => (
                        <li
                          key={funcion.id}
                          className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
                        >
                          <div className="space-y-1">
                            <time dateTime={funcion.inicio} className="font-bold">
                              {funcion.horaLocal}
                            </time>
                            <p className="text-sm text-muted">
                              {[
                                funcion.sala && `Sala ${funcion.sala}`,
                                funcion.formato,
                                funcion.idioma,
                                funcion.subtitulos && `Subtítulos: ${funcion.subtitulos}`,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                            <p className="text-xs text-muted">
                              Fuente:{' '}
                              {[
                                ...new Set(
                                  funcion.fuentes.map((fuente) =>
                                    fuente.fuenteId === 'butaca' ? 'Butaca / Cinemark' : 'SerpApi',
                                  ),
                                ),
                              ].join(', ')}
                            </p>
                          </div>
                          {renderAccion?.({ cine, funcion })}
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </Card>
          );
        })}
    </div>
  );
}
