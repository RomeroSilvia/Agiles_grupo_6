import { useState } from 'react';
import { MAX_REGIONES_COMPARACION, REGIONES_SOPORTADAS } from '@buscador/shared/constants';
import { Link } from 'react-router';
import { RUTAS } from '../../app/rutas.js';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { SeccionPlegable } from '../../components/ui/SeccionPlegable.jsx';
import { CheckIcon, GlobeIcon } from '../../components/ui/icons.jsx';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { useSession } from '../../contexts/session/SessionContext.js';
import { contarRegionesConPropias } from './comparacion.js';
import { formatearNombreRegion, marcarPlataformasPropias } from './detalle.constants.js';
import { SelectorRegiones } from './SelectorRegiones.jsx';
import { TablaComparacion } from './TablaComparacion.jsx';
import { useComparacionRegiones } from './useComparacionRegiones.js';
import { useDistincionPropias } from './useDistincionPropias.js';

export function ComparadorRegiones({
  tipo,
  tmdbId,
  regionActual,
  ofertasRegionActual = null,
  nombreTitulo,
}) {
  const { user, loading: cargandoSesion } = useSession();
  const { seleccionadas, distinguirPropias } = useDistincionPropias();
  const [seleccion, setSeleccion] = useState([]);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const { regiones, regionesFallidas, error, consultado, isLoading, comparar, reintentar } =
    useComparacionRegiones({ tipo, tmdbId });

  if (cargandoSesion) {
    return null;
  }

  if (!user) {
    return (
      <Card tone="inset" padding="sm" className="text-sm">
        <span className="text-muted">
          Iniciá sesión para comparar la disponibilidad en otras regiones.{' '}
        </span>
        <Link to={RUTAS.INICIAR_SESION} className={`${LINK_CLASS_NAME} rounded-sm underline`}>
          Iniciar sesión para comparar regiones
        </Link>
      </Card>
    );
  }

  const opcionesRegiones = REGIONES_SOPORTADAS.filter(({ codigo }) => codigo !== regionActual);
  const seleccionActiva = seleccion.filter((codigo) => codigo !== regionActual);

  function alternarRegion(codigo) {
    setSeleccion((previa) => {
      const filtrada = previa.filter((item) => item !== regionActual);
      if (filtrada.includes(codigo)) {
        return filtrada.filter((item) => item !== codigo);
      }
      if (filtrada.length >= MAX_REGIONES_COMPARACION) {
        return filtrada;
      }
      return [...filtrada, codigo];
    });
  }

  function manejarSubmit(evento) {
    evento.preventDefault();
    setSelectorAbierto(false);
    comparar(seleccionActiva);
  }

  const todasSinDisponibilidad =
    consultado &&
    regiones.length > 0 &&
    regiones.every(({ ofertas }) => ofertas.length === 0) &&
    regionesFallidas.length === 0;
  const mostrarResultados =
    !isLoading && !error && consultado && !todasSinDisponibilidad && regiones.length > 0;

  const marcar = (ofertas) =>
    marcarPlataformasPropias(ofertas, { distinguirPropias, seleccionadas });
  const filas = [
    ...(ofertasRegionActual
      ? [{ region: regionActual, ofertas: marcar(ofertasRegionActual), esActual: true }]
      : []),
    ...regiones.map(({ region, ofertas }) => ({ region, ofertas: marcar(ofertas) })),
  ];
  const regionesConPropias = contarRegionesConPropias(filas);

  return (
    <SeccionPlegable
      titulo="Comparar regiones"
      resumen={`Mirá en qué otros países está disponible · hasta ${MAX_REGIONES_COMPARACION}`}
      nivelTitulo="h3"
      icono={GlobeIcon}
      plegableEnEscritorio
    >
      <div className="space-y-4">
        <form onSubmit={manejarSubmit} className="space-y-4">
          <SelectorRegiones
            opciones={opcionesRegiones}
            seleccion={seleccionActiva}
            abierto={selectorAbierto}
            onAbiertoChange={setSelectorAbierto}
            onAlternar={alternarRegion}
          />
          <Button
            type="submit"
            size="compact"
            fullWidth={false}
            disabled={seleccionActiva.length === 0}
            loading={isLoading}
            loadingText="Comparando disponibilidad…"
          >
            Comparar disponibilidad
          </Button>
        </form>

        {error && (
          <Alert onRetry={seleccionActiva.length > 0 ? reintentar : undefined}>{error}</Alert>
        )}

        {!isLoading && !error && regionesFallidas.length > 0 && (
          <Alert>
            No se pudo obtener la disponibilidad para:{' '}
            {regionesFallidas.map(formatearNombreRegion).join(', ')}.
          </Alert>
        )}

        {!isLoading && !error && todasSinDisponibilidad && (
          <Card tone="inset" padding="sm" className="text-sm text-muted">
            No se encontró disponibilidad para este título en las regiones consultadas (
            {regiones.map(({ region }) => formatearNombreRegion(region)).join(', ')}).
          </Card>
        )}

        {mostrarResultados && (
          <>
            {distinguirPropias && regionesConPropias > 0 && (
              <p className="flex items-center gap-2 text-sm font-medium text-success">
                <CheckIcon className="size-4" />
                Lo podés ver con tus plataformas en {regionesConPropias} de {filas.length}{' '}
                {filas.length === 1 ? 'región' : 'regiones'}.
              </p>
            )}
            <TablaComparacion filas={filas} nombreTitulo={nombreTitulo} />
          </>
        )}
      </div>
    </SeccionPlegable>
  );
}
