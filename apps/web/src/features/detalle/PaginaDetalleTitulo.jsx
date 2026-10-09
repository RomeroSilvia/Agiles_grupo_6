import { useMemo } from 'react';
import { REGION_SOURCE, TIPO_OFERTA } from '@buscador/shared/constants';
import { useParams } from 'react-router';
import { NotFoundPage } from '../../app/NotFoundPage.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { Poster } from '../../components/ui/Poster.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { formatearPuntuacion } from '../../utils/formatearPuntuacion.js';
import { usePlataformasPropias } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';
import { useRegion } from '../../contexts/region/RegionContext.js';
import { useSession } from '../../contexts/session/SessionContext.js';
import { ETIQUETAS_TIPO_TITULO_SINGULAR } from '../busqueda/busqueda.constants.js';
import { useDetalleTitulo } from './useDetalleTitulo.js';
import { TarjetaDisponibilidad } from './TarjetaDisponibilidad.jsx';
import { VolverBusqueda } from './VolverBusqueda.jsx';
import { useDisponibilidad } from './useDisponibilidad.js';

const LINK_CLASS_NAME = `font-semibold text-link underline underline-offset-4 ${FOCUS_RING_CLASS_NAME}`;

const ETIQUETAS_OFERTA = Object.freeze({
  [TIPO_OFERTA.SUSCRIPCION]: 'Suscripción',
  [TIPO_OFERTA.GRATIS]: 'Gratis',
  [TIPO_OFERTA.CON_ANUNCIOS]: 'Gratis con anuncios',
  [TIPO_OFERTA.ALQUILER]: 'Alquiler',
  [TIPO_OFERTA.COMPRA]: 'Compra',
});

export function PaginaDetalleTitulo() {
  const { tipo, tmdbId } = useParams();
  const { region, source, loading: regionLoading } = useRegion();
  const { titulo, isLoading, error, errorCode } = useDetalleTitulo({ tipo, tmdbId });
  const {
    ofertas,
    enlaceTmdb,
    isLoading: cargandoDisponibilidad,
    error: errorDisponibilidad,
    reintentar: reintentarDisponibilidad,
  } = useDisponibilidad({ tipo, tmdbId, region, regionLoading });
  const { user, loading: cargandoSesion } = useSession();
  const { seleccionadas, loading: cargandoPropias } = usePlataformasPropias();
  const distinguirPropias = Boolean(user) && !cargandoSesion && !cargandoPropias;

  const ofertasConPropiedad = useMemo(
    () =>
      ofertas.map(({ tipoOferta, plataformas }) => ({
        tipoOferta,
        plataformas: plataformas
          .map((plataforma) => ({
            plataforma,
            esPropia: !distinguirPropias || seleccionadas.has(plataforma.id),
          }))
          .sort((a, b) => Number(b.esPropia) - Number(a.esPropia)),
      })),
    [ofertas, distinguirPropias, seleccionadas],
  );

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
    if (errorCode === 'NOT_FOUND') {
      return <NotFoundPage />;
    }

    return (
      <section className="space-y-6">
        <VolverBusqueda />
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
  const puntuacion = formatearPuntuacion(titulo.puntuacion) ?? 'Puntuación no disponible';

  return (
    <section className="space-y-8">
      <VolverBusqueda />

      <article className="grid gap-8 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8 md:grid-cols-[minmax(12rem,18rem)_1fr]">
        <Poster
          posterUrl={titulo.posterUrl}
          nombre={nombre}
          loading="eager"
          className="mx-auto aspect-2/3 max-w-xs rounded-2xl"
        />

        <div className="flex flex-col justify-center gap-6">
          <div className="space-y-3">
            <Chip>{ETIQUETAS_TIPO_TITULO_SINGULAR[titulo.tipo] ?? 'Título'}</Chip>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{nombre}</h1>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:max-w-md">
            <div className="rounded-2xl border border-border bg-background p-4">
              <dt className="text-sm text-muted">Año</dt>
              <dd className="mt-1 font-semibold">{titulo.anio ?? 'Año no disponible'}</dd>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <dt className="text-sm text-muted">Puntuación</dt>
              <dd className="mt-1 font-semibold">{puntuacion}</dd>
            </div>
          </dl>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Sinopsis</h2>
            <p className="max-w-3xl leading-7 text-muted">
              {titulo.sinopsis ?? 'Sinopsis no disponible'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="seccion-disponibilidad" className="text-xl font-semibold">
                Plataformas disponibles
              </h2>
              {!regionLoading && region && (
                <span
                  aria-label={`Región de disponibilidad: ${region}`}
                  className="rounded-full bg-chip px-2.5 py-0.5 font-mono text-xs font-medium text-chip-foreground"
                >
                  {region}
                </span>
              )}
            </div>

            {regionLoading && (
              <p role="status" aria-live="polite" className="text-sm text-muted">
                Detectando región...
              </p>
            )}

            {!regionLoading && source === REGION_SOURCE.DEFAULT && (
              <p className="text-sm text-muted">
                No pudimos detectar tu región. Mostramos la región predeterminada {region}.
              </p>
            )}

            {!regionLoading && cargandoDisponibilidad && (
              <p role="status" aria-live="polite" className="text-sm text-muted">
                Consultando disponibilidad...
              </p>
            )}

            {!cargandoDisponibilidad && errorDisponibilidad && (
              <div
                role="alert"
                className="flex flex-col gap-2 rounded-2xl border border-danger/30 bg-danger-surface p-4 text-sm text-danger sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{errorDisponibilidad}</span>
                <button
                  type="button"
                  onClick={reintentarDisponibilidad}
                  className={`cursor-pointer font-semibold underline underline-offset-4 hover:opacity-80 ${FOCUS_RING_CLASS_NAME}`}
                >
                  Reintentar
                </button>
              </div>
            )}

            {!cargandoDisponibilidad && !errorDisponibilidad && enlaceTmdb && (
              <a href={enlaceTmdb} target="_blank" rel="noreferrer" className={LINK_CLASS_NAME}>
                Ver disponibilidad en TMDB
              </a>
            )}

            {!cargandoDisponibilidad &&
              !errorDisponibilidad &&
              ofertasConPropiedad.length === 0 && (
                <p className="rounded-2xl border border-border bg-background p-4 text-sm text-muted">
                  No encontramos disponibilidad en plataformas de streaming para tu región.
                </p>
              )}

            {!cargandoDisponibilidad && !errorDisponibilidad && ofertasConPropiedad.length > 0 && (
              <div className="space-y-4">
                {ofertasConPropiedad.map(({ tipoOferta, plataformas }) => {
                  const etiquetaOferta = ETIQUETAS_OFERTA[tipoOferta] ?? tipoOferta;

                  return (
                    <section key={tipoOferta} aria-label={etiquetaOferta} className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted">{etiquetaOferta}</h3>
                      <ul
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                        aria-label={`Plataformas disponibles: ${etiquetaOferta}`}
                      >
                        {plataformas.map(({ plataforma, esPropia }) => (
                          <li key={plataforma.id}>
                            <TarjetaDisponibilidad plataforma={plataforma} esPropia={esPropia} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
