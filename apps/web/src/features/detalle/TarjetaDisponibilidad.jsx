import { useId } from 'react';
import { ExternalLink } from '../../components/ui/ExternalLink.jsx';
import { TOOLTIP_TRIGGER_CLASS_NAME, Tooltip } from '../../components/ui/Tooltip.jsx';
import { ArrowUpRightIcon } from '../../components/ui/icons.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { LogoPlataforma } from '../plataformas/LogoPlataforma.jsx';
import { obtenerDestinoPlataforma } from './destinoPlataforma.js';

const TAMANIOS_LOGO = {
  md: 'medium',
  sm: 'small',
};

const tileClassName = `${TOOLTIP_TRIGGER_CLASS_NAME} inline-flex rounded-xl border border-border bg-surface p-1 ${FOCUS_RING_CLASS_NAME}`;

function ContenidoTile({ plataforma, size, inactiva = false }) {
  return (
    <>
      <LogoPlataforma plataforma={plataforma} size={TAMANIOS_LOGO[size]} inactiva={inactiva} />
      <span className="sr-only">{plataforma.nombre}</span>
    </>
  );
}

function TarjetaNoPropia({ plataforma, size }) {
  const tooltipId = useId();

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`${plataforma.nombre} (no está en tus plataformas)`}
      aria-describedby={tooltipId}
      className={`${tileClassName} cursor-not-allowed`}
    >
      <ContenidoTile plataforma={plataforma} size={size} inactiva />
      <Tooltip id={tooltipId}>No tenés {plataforma.nombre} en tus plataformas</Tooltip>
    </div>
  );
}

export function TarjetaDisponibilidad({ plataforma, esPropia, nombreTitulo, size = 'md' }) {
  if (!esPropia) {
    return <TarjetaNoPropia plataforma={plataforma} size={size} />;
  }

  const destino = obtenerDestinoPlataforma(plataforma);

  if (!destino) {
    return (
      <div className={tileClassName}>
        <ContenidoTile plataforma={plataforma} size={size} />
      </div>
    );
  }

  const etiqueta =
    destino.esDeepLink && nombreTitulo
      ? `Ver ${nombreTitulo} en ${plataforma.nombre}`
      : `Ir a ${plataforma.nombre}`;

  return (
    <ExternalLink
      href={destino.href}
      aria-label={etiqueta}
      className={`${tileClassName} transition-colors duration-150 hover:border-primary`}
    >
      <ContenidoTile plataforma={plataforma} size={size} />
      <span
        aria-hidden="true"
        className="absolute -top-1.5 -right-1.5 inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-surface"
      >
        <ArrowUpRightIcon className="size-3" />
      </span>
      <Tooltip decorative>{etiqueta}</Tooltip>
    </ExternalLink>
  );
}
