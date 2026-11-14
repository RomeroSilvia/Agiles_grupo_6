import { useId } from 'react';
import { ExternalLink } from '../../components/ui/ExternalLink.jsx';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { obtenerDestinoCine } from './destinoCine.js';

export function AccionSitioCine({ cine, funcion }) {
  const id = useId();
  const destino = obtenerDestinoCine({ cine, funcion });
  if (!destino) return <span className="text-sm text-muted">Enlace no disponible</span>;
  return (
    <div className="max-w-sm space-y-1 text-sm">
      <ExternalLink
        href={destino.url}
        aria-describedby={id}
        className={`${LINK_CLASS_NAME} inline-block rounded-sm`}
      >
        {destino.etiqueta}
      </ExternalLink>
      <p id={id} className="text-xs text-muted">
        Se abre un sitio externo.
        {destino.tipo === 'sitio'
          ? ' Información general; buscá la película en ese sitio.'
          : ' Consultá las condiciones y disponibilidad en el cine.'}
      </p>
    </div>
  );
}
