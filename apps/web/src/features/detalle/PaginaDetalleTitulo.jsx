import { REGION_SOURCE, TIPO_OFERTA } from '@buscador/shared/constants';
import { Link, useLocation, useParams } from 'react-router';
import { useDetalleTitulo } from '../../hooks/useDetalleTitulo.js';
import { useRegion } from '../../contexts/region/RegionContext.js';
import { Attribution } from '../../components/ui/Attribution.jsx';
import { LogoPlataforma } from '../plataformas/LogoPlataforma.jsx';
import { useDisponibilidad } from './useDisponibilidad.js';

const LINK_VOLVER_CLASS_NAME =
  'font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const ETIQUETAS_TIPO = {
  pelicula: 'Película',
  serie: 'Serie',
};

const ETIQUETAS_OFERTA = {
  [TIPO_OFERTA.SUSCRIPCION]: 'Suscripción',
  [TIPO_OFERTA.GRATIS]: 'Gratis',
  [TIPO_OFERTA.CON_ANUNCIOS]: 'Con anuncios',
  [TIPO_OFERTA.ALQUILER]: 'Alquiler',
  [TIPO_OFERTA.COMPRA]: 'Compra',
};

function formatearPuntuacion(puntuacion) {
  return puntuacion === null || puntuacion === undefined
    ? 'Puntuación no disponible'
    : `${puntuacion.toFixed(1)}/10`;
}

export function PaginaDetalleTitulo() {
  const location = useLocation();
  const { tipo, tmdbId } = useParams();
  const { titulo, isLoading, error } = useDetalleTitulo({ tipo, tmdbId });
  const { region, source, loading: regionLoading } = useRegion();
  const {
    disponibilidad,
    isLoading: disponibilidadLoading,
    error: disponibilidadError,
  } = useDisponibilidad({ tipo, tmdbId, region, regionLoading });
  const estadoBusqueda = location.state?.busqueda;

  if (isLoading) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-primary"
      >
        Cargando detalle del título...
      </p>
    );
  }

  if (error) {
    return (
      <section className="space-y-6">
        <Link
          to="/"
          state={estadoBusqueda ? { busqueda: estadoBusqueda } : undefined}
          className={LINK_VOLVER_CLASS_NAME}
        >
          Volver a la búsqueda
        </Link>
        <p
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger-surface p-5 text-danger"
        >
          {error}
        </p>
      </section>
    );
  }

  if (!titulo) {
    return null;
  }

  const nombre = titulo.nombre ?? 'Título no disponible';

  return (
    <section className="space-y-8">
      <Link
        to="/"
        state={estadoBusqueda ? { busqueda: estadoBusqueda } : undefined}
        className={LINK_VOLVER_CLASS_NAME}
      >
        Volver a la búsqueda
      </Link>

      <article className="grid gap-8 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8 md:grid-cols-[minmax(12rem,18rem)_1fr]">
        <div className="mx-auto aspect-2/3 w-full max-w-xs overflow-hidden rounded-2xl bg-background">
          {titulo.posterUrl ? (
            <img
              src={titulo.posterUrl}
              alt={`Póster de ${nombre}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted">
              Sin imagen disponible
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-chip px-2.5 py-1 font-mono text-xs font-medium text-chip-foreground">
              {ETIQUETAS_TIPO[titulo.tipo] ?? 'Título'}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{nombre}</h1>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:max-w-md">
            <div className="rounded-2xl border border-border bg-background p-4">
              <dt className="text-sm text-muted">Año</dt>
              <dd className="mt-1 font-semibold">{titulo.anio ?? 'Año no disponible'}</dd>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <dt className="text-sm text-muted">Puntuación</dt>
              <dd className="mt-1 font-semibold">{formatearPuntuacion(titulo.puntuacion)}</dd>
            </div>
          </dl>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Sinopsis</h2>
            <p className="max-w-3xl leading-7 text-muted">
              {titulo.sinopsis ?? 'Sinopsis no disponible'}
            </p>
          </div>
        </div>
      </article>

      <section className="space-y-4 rounded-3xl border border-border bg-surface p-5 sm:p-8 dark:bg-surface">
        <h2 className="text-xl font-semibold">
          Disponibilidad{regionLoading ? '' : ` en ${region}`}
        </h2>
        {!regionLoading && source === REGION_SOURCE.DEFAULT && (
          <p className="text-sm text-muted">
            No pudimos detectar tu región. Mostramos la región predeterminada {region}.
          </p>
        )}
        {regionLoading ? (
          <p role="status">Detectando región...</p>
        ) : disponibilidadLoading ? (
          <p role="status">Consultando disponibilidad...</p>
        ) : disponibilidadError ? (
          <p role="alert" className="text-danger">
            {disponibilidadError}
          </p>
        ) : disponibilidad?.ofertas.length ? (
          <div className="space-y-5">
            {disponibilidad.ofertas.map(({ tipoOferta, plataformas }) => (
              <div key={tipoOferta} className="space-y-2">
                <h3 className="font-semibold">{ETIQUETAS_OFERTA[tipoOferta]}</h3>
                <ul className="flex flex-wrap gap-2">
                  {plataformas.map((plataforma) => (
                    <li
                      key={plataforma.tmdbProviderId}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm dark:bg-background"
                    >
                      <LogoPlataforma plataforma={plataforma} size="small" />
                      {plataforma.nombre}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {disponibilidad.enlaceTmdb && (
              <a
                href={disponibilidad.enlaceTmdb}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_VOLVER_CLASS_NAME}
              >
                Ver opciones en TMDB
              </a>
            )}
          </div>
        ) : (
          <p>No encontramos disponibilidad para este título en {region}.</p>
        )}
        <Attribution />
      </section>
    </section>
  );
}
