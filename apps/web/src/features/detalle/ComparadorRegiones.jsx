import { useState } from 'react';
import {
  MAX_REGIONES_COMPARACION,
  NOMBRES_REGION,
  REGIONES_SOPORTADAS,
  TIPO_OFERTA,
} from '@buscador/shared/constants';
import { Link } from 'react-router';
import { RUTAS } from '../../app/rutas.js';
import { Button } from '../../components/ui/Button.jsx';
import { TextButton } from '../../components/ui/TextButton.jsx';
import { FOCUS_RING_CLASS_NAME, LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { TarjetaDisponibilidad } from './TarjetaDisponibilidad.jsx';
import { useComparacionRegiones } from './useComparacionRegiones.js';

const ETIQUETAS_OFERTA = Object.freeze({
  [TIPO_OFERTA.SUSCRIPCION]: 'Suscripción',
  [TIPO_OFERTA.GRATIS]: 'Gratis',
  [TIPO_OFERTA.CON_ANUNCIOS]: 'Gratis con anuncios',
  [TIPO_OFERTA.ALQUILER]: 'Alquiler',
  [TIPO_OFERTA.COMPRA]: 'Compra',
});

function formatearNombreRegion(codigo) {
  const nombre = NOMBRES_REGION[codigo];
  return nombre ? `${nombre} (${codigo})` : codigo;
}

function ordenarPlataformas(plataformas, distinguirPropias, seleccionadas) {
  return plataformas
    .map((plataforma) => ({
      plataforma,
      esPropia: !distinguirPropias || seleccionadas.has(plataforma.id),
    }))
    .sort((a, b) => Number(b.esPropia) - Number(a.esPropia));
}

export function ComparadorRegiones({
  tipo,
  tmdbId,
  regionActual,
  nombreTitulo,
  distinguirPropias = false,
  seleccionadas = new Set(),
  tieneSesion = false,
  cargandoSesion = false,
}) {
  const [seleccion, setSeleccion] = useState([]);
  const { regiones, regionesFallidas, error, consultado, isLoading, comparar, reintentar } =
    useComparacionRegiones({ tipo, tmdbId });

  if (cargandoSesion) {
    return null;
  }

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
    <section
      aria-labelledby="titulo-comparacion-regiones"
      className="space-y-4 rounded-2xl border border-border bg-background p-4 sm:p-5"
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="titulo-comparacion-regiones" className="text-base font-semibold">
            Comparar disponibilidad en otras regiones
          </h3>
          <span className="text-xs font-medium text-muted">
            Seleccionadas: {seleccionActiva.length}/{MAX_REGIONES_COMPARACION}
          </span>
        </div>
        <p className="text-sm text-muted">
          Seleccioná hasta {MAX_REGIONES_COMPARACION} regiones para conocer dónde se encuentra
          disponible este título.
        </p>
      </div>

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
              <button
                key={codigo}
                type="button"
                aria-label={`${nombre} (${codigo})`}
                aria-pressed={activa}
                disabled={deshabilitada}
                onClick={() => alternarRegion(codigo)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${FOCUS_RING_CLASS_NAME} ${
                  activa
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface text-foreground hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50'
                }`}
              >
                <span>{nombre}</span> <span className="font-mono opacity-80">({codigo})</span>
              </button>
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
            <div key={region} className="space-y-3 rounded-xl border border-border bg-surface p-4">
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
                <div className="space-y-3">
                  {ofertas.map(({ tipoOferta, plataformas }) => {
                    const etiquetaOferta = ETIQUETAS_OFERTA[tipoOferta] ?? tipoOferta;
                    const plataformasOrdenadas = ordenarPlataformas(
                      plataformas,
                      distinguirPropias,
                      seleccionadas,
                    );

                    return (
                      <div key={tipoOferta} className="space-y-2">
                        <p className="text-xs font-semibold text-muted">{etiquetaOferta}</p>
                        <ul
                          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
                          aria-label={`Plataformas en ${region}: ${etiquetaOferta}`}
                        >
                          {plataformasOrdenadas.map(({ plataforma, esPropia }) => (
                            <li key={plataforma.id}>
                              <TarjetaDisponibilidad
                                plataforma={plataforma}
                                esPropia={esPropia}
                                nombreTitulo={nombreTitulo}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
