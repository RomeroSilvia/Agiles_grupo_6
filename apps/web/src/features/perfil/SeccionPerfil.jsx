import { useId, useState } from 'react';
import { ChevronDownIcon } from '../../components/ui/icons.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { CARD_CLASS_NAME } from '../../components/ui/surface.js';

export function SeccionPerfil({ titulo, resumen, descripcion, className = '', children }) {
  const [abierta, setAbierta] = useState(false);
  const contenidoId = useId();

  return (
    <section className={className}>
      <h2 className="lg:hidden">
        <button
          type="button"
          aria-expanded={abierta}
          aria-controls={contenidoId}
          onClick={() => setAbierta((actual) => !actual)}
          className={`flex w-full cursor-pointer items-center gap-3 px-4.5 py-4 text-left ${CARD_CLASS_NAME} ${FOCUS_RING_CLASS_NAME}`}
        >
          <span className="flex-1">
            <span className="block text-xl font-bold">{titulo}</span>
            <span className="block font-sans text-sm text-muted">{resumen}</span>
          </span>
          <ChevronDownIcon
            className={`size-5 text-muted transition-transform duration-150 ${abierta ? 'rotate-180' : ''}`}
          />
        </button>
      </h2>

      <header className="hidden space-y-1 lg:block">
        <h2 className="text-2xl font-bold">{titulo}</h2>
        {descripcion && <p className="text-muted">{descripcion}</p>}
      </header>

      <div id={contenidoId} className={`${abierta ? 'mt-3' : 'hidden'} lg:mt-4 lg:block`}>
        {children}
      </div>
    </section>
  );
}
