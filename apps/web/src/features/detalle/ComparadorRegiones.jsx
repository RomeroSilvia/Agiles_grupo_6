import { useState } from 'react';
import { MAX_REGIONES_COMPARACION, REGIONES_SOPORTADAS } from '@buscador/shared/constants';
import { Link } from 'react-router';
import { RUTAS } from '../../app/rutas.js';
import { Button } from '../../components/ui/Button.jsx';
import { SeccionPlegable } from '../../components/ui/SeccionPlegable.jsx';
import { TextButton } from '../../components/ui/TextButton.jsx';
import { ToggleChip } from '../../components/ui/ToggleChip.jsx';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { usePlataformasPropias } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';
import { useSession } from '../../contexts/session/SessionContext.js';
import { formatearNombreRegion, marcarPlataformasPropias } from './detalle.constants.js';
import { ListaOfertas } from './ListaOfertas.jsx';
import { useComparacionRegiones } from './useComparacionRegiones.js';

export function ComparadorRegiones({ tipo, tmdbId, regionActual, nombreTitulo }) {
  const { user, loading: cargandoSesion } = useSession();
  const { seleccionadas, loading: cargandoPropias } = usePlataformasPropias();
  const [seleccion, setSeleccion] = useState([]);
  const { regiones, regionesFallidas, error, consultado, isLoading, comparar, reintentar } =
    useComparacionRegiones({ tipo, tmdbId });

  if (cargandoSesion) {
    return null;
  }

  const tieneSesion = Boolean(user);
  const distinguirPropias = tieneSesion && !cargandoPropias;

  if (!tieneSesion) {
    return (
      <div className="rounded-2xl border border-border bg-background p-4 text-sm">
        <span className="text-muted">
          Iniciá sesión para comparar la disponibilidad en otras regiones.{' '}
        </span>
        <Link
          to={RUTAS.INICIAR_SESION}
          className={`${LINK_CLASS_NAME} rounded-sm font-semibold text-link underline underline-offset-4`}
        >
          Iniciar sesión para comparar regiones
        </Link>
      </div>
    );
  }

  const opcionesRegiones = REGIONES_SOPORTADAS.filter(({ codigo }) => codigo !== regionActual);
  const seleccionActiva = seleccion.filter((codigo) => codigo !== regionActual);
  const limiteAlcanzado = seleccionActiva.length >= MAX_REGIONES_COMPARACION;

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
    comparar(seleccionActiva);
  }

  const todasSinDisponibilidad =
    consultado &&
    regiones.length > 0 &&
    regiones.every(({ ofertas }) => ofertas.length === 0) &&
    regionesFallidas.length === 0;

  return (
    <SeccionPlegable
      titulo="Comparar disponibilidad en otras regiones"
      resumen={`Hasta ${MAX_REGIONES_COMPARACION} regiones`}
      nivelTitulo="h3"
      plegableEnEscritorio
    >
      <div className="space-y-4 rounded-2xl border border-border bg-background p-4 sm:p-5">
        <form onSubmit={manejarSubmit} className="space-y-4">
          <div
            role="group"
            aria-label="Regiones disponibles para comparar"
            className="flex flex-wrap gap-2"
          >
            {opcionesRegiones.map(({ codigo, nombre }) => {
              const activa = seleccionActiva.includes(codigo);
              const deshabilitada = !activa && limiteAlcanzado;

              return (
                <ToggleChip
                  key={codigo}
                  aria-label={`${nombre} (${codigo})`}
                  pressed={activa}
                  disabled={deshabilitada}
                  onClick={() => alternarRegion(codigo)}
                >
                  <span>{nombre}</span> <span className="font-mono opacity-80">({codigo})</span>
                </ToggleChip>
              );
            })}
          </div>

          <Button
            type="submit"
            size="compact"
            disabled={seleccionActiva.length === 0}
            loading={isLoading}
            loadingText="Comparando disponibilidad…"
          >
            Comparar disponibilidad
          </Button>
        </form>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-xl border border-danger/30 bg-danger-surface p-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>
            {seleccionActiva.length > 0 && <TextButton onClick={reintentar}>Reintentar</TextButton>}
          </div>
        )}

        {!isLoading && !error && regionesFallidas.length > 0 && (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger-surface p-3 text-sm text-danger"
          >
            No se pudo obtener la disponibilidad para:{' '}
            {regionesFallidas.map(formatearNombreRegion).join(', ')}.
          </p>
        )}

        {!isLoading && !error && todasSinDisponibilidad && (
          <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            No se encontró disponibilidad para este título en las regiones consultadas (
            {regiones.map(({ region }) => formatearNombreRegion(region)).join(', ')}).
          </p>
        )}

        {!isLoading && !error && consultado && !todasSinDisponibilidad && regiones.length > 0 && (
          <div className="space-y-3" aria-label="Resultados de comparación por región">
            {regiones.map(({ region, ofertas }) => (
              <div
                key={region}
                className="space-y-3 rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">{formatearNombreRegion(region)}</h4>
                  <span className="rounded-full bg-chip px-2 py-0.5 font-mono text-xs font-medium text-chip-foreground">
                    {region}
                  </span>
                </div>

                {ofertas.length === 0 ? (
                  <p className="text-sm text-muted">
                    Sin disponibilidad en plataformas de streaming en esta región.
                  </p>
                ) : (
                  <ListaOfertas
                    ofertas={marcarPlataformasPropias(ofertas, {
                      distinguirPropias,
                      seleccionadas,
                    })}
                    nombreTitulo={nombreTitulo}
                    etiquetaLista={`Plataformas en ${region}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SeccionPlegable>
  );
}
