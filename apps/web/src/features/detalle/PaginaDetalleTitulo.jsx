import { useMemo } from 'react';
import { REGION_SOURCE } from '@buscador/shared/constants';
import { Link, useParams } from 'react-router';
import { NotFoundPage } from '../../app/NotFoundPage.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Chip } from '../../components/ui/Chip.jsx';
import { ExternalLink } from '../../components/ui/ExternalLink.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Poster } from '../../components/ui/Poster.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { ArrowUpRightIcon, BookmarkIcon, StarIcon } from '../../components/ui/icons.jsx';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { formatearPuntuacion } from '../../utils/formatearPuntuacion.js';
import { useRegion } from '../../contexts/region/RegionContext.js';
import { useSession } from '../../contexts/session/SessionContext.js';
import { ETIQUETAS_TIPO_TITULO_SINGULAR } from '../busqueda/busqueda.constants.js';
import { useDetalleTitulo } from './useDetalleTitulo.js';
import { AttributionDisponibilidad } from '../../components/ui/Attribution.jsx';
import { ComparadorRegiones } from './ComparadorRegiones.jsx';
import { DetalleTituloCargando } from './DetalleTituloCargando.jsx';
import { LeyendaDisponibilidad } from './LeyendaDisponibilidad.jsx';
import { marcarPlataformasPropias } from './detalle.constants.js';
import { ListaOfertas } from './ListaOfertas.jsx';
import { VolverBusqueda } from './VolverBusqueda.jsx';
import { useDisponibilidad } from './useDisponibilidad.js';
import { useDistincionPropias } from './useDistincionPropias.js';
import { RUTAS } from '../../app/rutas.js';
import { useWatchlistTitle } from '../watchlist/useWatchlistTitle.js';
import { SeccionFunciones } from '../cartelera/SeccionFunciones.jsx';

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
  const { seleccionadas, distinguirPropias } = useDistincionPropias();

  const ofertasConPropiedad = useMemo(
    () => marcarPlataformasPropias(ofertas, { distinguirPropias, seleccionadas }),
    [ofertas, distinguirPropias, seleccionadas],
  );

  if (isLoading) {
    return <DetalleTituloCargando />;
  }

  if (error) {
    if (errorCode === 'NOT_FOUND') {
      return <NotFoundPage />;
    }

    return (
      <section className="space-y-6">
        <VolverBusqueda />
        <Alert>{error}</Alert>
      </section>
    );
  }

  if (!titulo) {
    return null;
  }

  const nombre = titulo.nombre ?? 'Título no disponible';
  const puntuacion = formatearPuntuacion(titulo.puntuacion);

  return (
    <section className="space-y-8">
      <VolverBusqueda />

      <Card
        as="article"
        padding="lg"
        elevated
        className="grid gap-8 md:grid-cols-[minmax(12rem,18rem)_1fr]"
      >
        <Poster
          posterUrl={titulo.posterUrl}
          nombre={nombre}
          loading="eager"
          className="mx-auto aspect-2/3 w-full max-w-xs self-start rounded-card"
        />

        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <Chip>{ETIQUETAS_TIPO_TITULO_SINGULAR[titulo.tipo] ?? 'Título'}</Chip>
            <PageHeader titulo={nombre} size="hero" />
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
                  className={`${LINK_CLASS_NAME} rounded-sm underline`}
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
                variant={agregado ? 'outline' : 'primary'}
                size="compact"
                fullWidth={false}
              >
                <BookmarkIcon className={`size-4 ${agregado ? 'fill-current' : ''}`} />
                {agregado ? 'Quitar de mi watchlist' : 'Agregar a mi watchlist'}
              </Button>
            )}
            {user && errorWatchlist && (
              <Alert onRetry={reintentarWatchlist}>
                {errorWatchlist}
                {estadoWatchlistCargado &&
                  ` Estado guardado: ${agregado ? 'está en tu watchlist.' : 'no está en tu watchlist.'}`}
              </Alert>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:max-w-md">
            <DatoTitulo etiqueta="Año">{titulo.anio ?? 'Año no disponible'}</DatoTitulo>
            <DatoTitulo etiqueta="Puntuación">
              {puntuacion ? (
                <span className="inline-flex items-center gap-1.5">
                  <StarIcon className="size-4 fill-rating text-rating" />
                  {puntuacion}
                </span>
              ) : (
                'Puntuación no disponible'
              )}
            </DatoTitulo>
          </dl>

          <div className="space-y-2">
            <SectionTitle>Sinopsis</SectionTitle>
            <p className="max-w-3xl leading-7 text-muted">
              {titulo.sinopsis ?? 'Sinopsis no disponible'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle id="seccion-disponibilidad">Plataformas disponibles</SectionTitle>
              {!regionLoading && region && (
                <span aria-label={`Región de disponibilidad: ${region}`}>
                  <Chip>{region}</Chip>
                </span>
              )}
            </div>

            {distinguirPropias && ofertasConPropiedad.length > 0 && <LeyendaDisponibilidad />}

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
              <Alert onRetry={reintentarDisponibilidad}>{errorDisponibilidad}</Alert>
            )}

            {!cargandoDisponibilidad &&
              !errorDisponibilidad &&
              ofertasConPropiedad.length === 0 && (
                <Card tone="inset" padding="sm" className="text-sm text-muted">
                  No encontramos disponibilidad en plataformas de streaming para tu región.
                </Card>
              )}

            {!cargandoDisponibilidad && !errorDisponibilidad && ofertasConPropiedad.length > 0 && (
              <ListaOfertas
                ofertas={ofertasConPropiedad}
                nombreTitulo={titulo.nombre}
                etiquetaLista="Plataformas disponibles"
              />
            )}

            {!cargandoDisponibilidad && !errorDisponibilidad && enlaceTmdb && (
              <ExternalLink
                href={enlaceTmdb}
                className={`${LINK_CLASS_NAME} inline-flex items-center gap-1.5 rounded-sm text-sm`}
              >
                Ver disponibilidad en TMDB
                <ArrowUpRightIcon className="size-4" />
              </ExternalLink>
            )}

            {!regionLoading && (
              <div className="border-t border-border pt-6">
                <ComparadorRegiones
                  tipo={tipo}
                  tmdbId={tmdbId}
                  regionActual={region}
                  ofertasRegionActual={
                    cargandoDisponibilidad || errorDisponibilidad ? null : ofertas
                  }
                  nombreTitulo={titulo.nombre}
                />
              </div>
            )}

            <AttributionDisponibilidad />
          </div>
        </div>
      </Card>
      {tipo === 'pelicula' && <SeccionFunciones key={tmdbId} tmdbId={tmdbId} />}
    </section>
  );
}

function DatoTitulo({ etiqueta, children }) {
  return (
    <Card tone="inset" padding="sm">
      <dt className="text-sm text-muted">{etiqueta}</dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </Card>
  );
}
