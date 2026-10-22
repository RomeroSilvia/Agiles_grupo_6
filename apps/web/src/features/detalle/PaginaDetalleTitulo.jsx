import { useMemo } from 'react';
import { REGION_SOURCE, TIPO_OFERTA } from '@buscador/shared/constants';
import { Link, useParams } from 'react-router';
import { NotFoundPage } from '../../app/NotFoundPage.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Poster } from '../../components/ui/Poster.jsx';
import { TextButton } from '../../components/ui/TextButton.jsx';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { formatearPuntuacion } from '../../utils/formatearPuntuacion.js';
import { usePlataformasPropias } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';
import { useRegion } from '../../contexts/region/RegionContext.js';
import { useSession } from '../../contexts/session/SessionContext.js';
import { ETIQUETAS_TIPO_TITULO_SINGULAR } from '../busqueda/busqueda.constants.js';
import { useDetalleTitulo } from './useDetalleTitulo.js';
import { AttributionDisponibilidad } from '../../components/ui/Attribution.jsx';
import { ComparadorRegiones } from './ComparadorRegiones.jsx';
import { SugerenciaRegionesAlternativas } from './SugerenciaRegionesAlternativas.jsx';
import { TarjetaDisponibilidad } from './TarjetaDisponibilidad.jsx';
import { VolverBusqueda } from './VolverBusqueda.jsx';
import { useDisponibilidad } from './useDisponibilidad.js';
import { RUTAS } from '../../app/rutas.js';
import { useWatchlistTitle } from '../watchlist/useWatchlistTitle.js';

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
  const {
    agregado,
    estadoCargado: estadoWatchlistCargado,
    cargando: cargandoWatchlist,
    actualizando: actualizandoWatchlist,
    error: errorWatchlist,
    alternar: alternarWatchlist,
    reintentar: reintentarWatchlist,
  } = useWatchlistTitle({ tipo, tmdbId });
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

          <div className="space-y-2">
            {cargandoSesion && (
              <p role="status" className="text-sm text-muted">
                Cargando el estado de tu watchlist…
              </p>
            )}
            {!cargandoSesion && !user && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted">Iniciá sesión para guardar este título.</span>
                <Link
                  to={RUTAS.INICIAR_SESION}
                  className={`${LINK_CLASS_NAME} rounded-sm font-semibold text-link underline underline-offset-4`}
                >
                  Iniciar sesión
                </Link>
              </div>
            )}
            {user && cargandoWatchlist && (
              <p role="status" className="text-sm text-muted">
                Consultando tu watchlist…
              </p>
            )}
            {user && estadoWatchlistCargado && (
              <Button
                onClick={alternarWatchlist}
                loading={actualizandoWatchlist}
                loadingText="Guardando…"
                variant={agregado ? 'accent' : 'primary'}
                className="sm:w-auto"
              >
                {agregado ? 'Quitar de mi watchlist' : 'Agregar a mi watchlist'}
              </Button>
            )}
            {user && errorWatchlist && (
              <div
                role="alert"
                className="flex flex-col gap-2 rounded-xl border border-danger/30 bg-danger-surface p-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  {errorWatchlist}
                  {estadoWatchlistCargado &&
                    ` Estado guardado: ${agregado ? 'está en tu watchlist.' : 'no está en tu watchlist.'}`}
                </span>
                <TextButton onClick={reintentarWatchlist}>Reintentar</TextButton>
              </div>
            )}
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
                <TextButton onClick={reintentarDisponibilidad}>Reintentar</TextButton>
              </div>
            )}

            {!cargandoDisponibilidad && !errorDisponibilidad && enlaceTmdb && (
              <a
                href={enlaceTmdb}
                target="_blank"
                rel="noreferrer"
                className={`${LINK_CLASS_NAME} underline`}
              >
                Ver disponibilidad en TMDB
              </a>
            )}

            {!cargandoDisponibilidad &&
              !errorDisponibilidad &&
              ofertasConPropiedad.length === 0 && (
                <>
                  <p className="rounded-2xl border border-border bg-background p-4 text-sm text-muted">
                    No encontramos disponibilidad en plataformas de streaming para tu región.
                  </p>
                  <SugerenciaRegionesAlternativas
                    tipo={tipo}
                    tmdbId={tmdbId}
                    regionActual={region}
                    nombreTitulo={titulo.nombre}
                    distinguirPropias={distinguirPropias}
                    seleccionadas={seleccionadas}
                    activo={Boolean(user) && !cargandoSesion && !regionLoading}
                  />
                </>
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
                            <TarjetaDisponibilidad
                              plataforma={plataforma}
                              esPropia={esPropia}
                              nombreTitulo={titulo.nombre}
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}

            {!regionLoading && (
              <ComparadorRegiones
                tipo={tipo}
                tmdbId={tmdbId}
                regionActual={region}
                nombreTitulo={titulo.nombre}
                distinguirPropias={distinguirPropias}
                seleccionadas={seleccionadas}
                tieneSesion={Boolean(user)}
                cargandoSesion={cargandoSesion}
              />
            )}

            <div className="pt-2">
              <AttributionDisponibilidad />
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
