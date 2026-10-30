import { APP_NAME } from '../../config/app.config.js';
import { TextButton } from '../../components/ui/TextButton.jsx';
import { usePlataformasPropias } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';
import { useSession } from '../../contexts/session/SessionContext.js';
import { formatearNombreRegion, marcarPlataformasPropias } from './detalle.constants.js';
import { ListaOfertas } from './ListaOfertas.jsx';
import { useRegionesAlternativas } from './useRegionesAlternativas.js';

export function SugerenciaRegionesAlternativas({
  tipo,
  tmdbId,
  regionActual,
  nombreTitulo,
  activo = false,
}) {
  const { user, loading: cargandoSesion } = useSession();
  const { seleccionadas, loading: cargandoPropias } = usePlataformasPropias();
  const tieneSesion = Boolean(user) && !cargandoSesion;
  const distinguirPropias = tieneSesion && !cargandoPropias;
  const habilitado = activo && tieneSesion;

  const { alternativas, isLoading, error, reintentar } = useRegionesAlternativas({
    tipo,
    tmdbId,
    region: regionActual,
    activo: habilitado,
  });

  if (!habilitado) {
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

            <ListaOfertas
              ofertas={marcarPlataformasPropias(ofertas, { distinguirPropias, seleccionadas })}
              nombreTitulo={nombreTitulo}
              etiquetaLista={`Plataformas sugeridas en ${region}`}
            />
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
