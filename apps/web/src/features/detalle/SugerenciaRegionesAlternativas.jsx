import { NOMBRES_REGION, TIPO_OFERTA } from '@buscador/shared/constants';
import { APP_NAME } from '../../config/app.config.js';
import { TextButton } from '../../components/ui/TextButton.jsx';
import { TarjetaDisponibilidad } from './TarjetaDisponibilidad.jsx';
import { useRegionesAlternativas } from './useRegionesAlternativas.js';

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

export function SugerenciaRegionesAlternativas({
  tipo,
  tmdbId,
  regionActual,
  nombreTitulo,
  distinguirPropias = false,
  seleccionadas = new Set(),
  activo = false,
}) {
  const { alternativas, isLoading, error, reintentar } = useRegionesAlternativas({
    tipo,
    tmdbId,
    region: regionActual,
    activo,
  });

  if (!activo) {
    return null;
  }

  if (isLoading) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-muted">
        Buscando disponibilidad en regiones alternativas...
      </p>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col gap-2 rounded-2xl border border-danger/30 bg-danger-surface p-4 text-sm text-danger sm:flex-row sm:items-center sm:justify-between"
      >
        <span>{error}</span>
        <TextButton onClick={reintentar}>Reintentar</TextButton>
      </div>
    );
  }

  if (alternativas.length === 0) {
    return null;
  }

  const resumenRegiones = alternativas
    .map(({ region }) => formatearNombreRegion(region))
    .join(', ');

  return (
    <section
      aria-labelledby="titulo-regiones-alternativas"
      className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5"
    >
      <div className="space-y-1">
        <h3 id="titulo-regiones-alternativas" className="text-base font-semibold">
          Regiones alternativas disponibles
        </h3>
        <p className="text-sm text-muted">
          Este título no está disponible en tu región actual, pero se encuentra disponible en:{' '}
          <span className="font-semibold text-foreground">{resumenRegiones}</span>.
        </p>
      </div>

      <div className="space-y-3" aria-label="Lista de regiones alternativas sugeridas">
        {alternativas.map(({ region, ofertas }) => (
          <div key={region} className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">{formatearNombreRegion(region)}</h4>
              <span className="rounded-full bg-chip px-2 py-0.5 font-mono text-xs font-medium text-chip-foreground">
                {region}
              </span>
            </div>

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
                      aria-label={`Plataformas sugeridas en ${region}: ${etiquetaOferta}`}
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
          </div>
        ))}
      </div>

      <p className="rounded-xl border border-border bg-surface p-3 text-xs leading-5 text-muted">
        Podés decidir por tu cuenta si acceder a este título utilizando una VPN. {APP_NAME} brinda
        únicamente información de disponibilidad y no ofrece directamente un servicio de VPN.
      </p>
    </section>
  );
}
