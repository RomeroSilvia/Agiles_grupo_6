import { useId } from 'react';
import { LogoPlataforma } from '../plataformas/LogoPlataforma.jsx';

const tarjetaClassName =
  'flex items-center gap-3.5 rounded-2xl border border-border bg-background px-4 py-3';

function ContenidoTarjeta({ plataforma }) {
  return (
    <>
      <LogoPlataforma plataforma={plataforma} />
      <span className="font-semibold text-foreground">{plataforma.nombre}</span>
    </>
  );
}

function TarjetaNoPropia({ plataforma }) {
  const tooltipId = useId();

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`${plataforma.nombre} (no está en tus plataformas)`}
      aria-describedby={tooltipId}
      className={`${tarjetaClassName} group relative cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
    >
      <div aria-hidden="true" className="flex items-center gap-3.5 opacity-60 blur-[2px]">
        <ContenidoTarjeta plataforma={plataforma} />
      </div>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none invisible absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-xl bg-foreground px-3 py-2 text-center text-sm font-medium text-background opacity-0 shadow-md transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100"
      >
        No tenés {plataforma.nombre} en tus plataformas
      </span>
    </div>
  );
}

export function TarjetaDisponibilidad({ plataforma, esPropia }) {
  if (!esPropia) {
    return <TarjetaNoPropia plataforma={plataforma} />;
  }

  if (!plataforma.urlHome) {
    return (
      <div className={tarjetaClassName}>
        <ContenidoTarjeta plataforma={plataforma} />
      </div>
    );
  }

  return (
    <a
      href={plataforma.urlHome}
      target="_blank"
      rel="noreferrer"
      className={`${tarjetaClassName} transition-colors duration-150 hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
      title={`Ir a ${plataforma.nombre}`}
    >
      <ContenidoTarjeta plataforma={plataforma} />
    </a>
  );
}
