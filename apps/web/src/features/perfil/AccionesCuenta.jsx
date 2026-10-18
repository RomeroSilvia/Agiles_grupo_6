import { Link } from 'react-router';
import { Chip } from '../../components/ui/Chip.jsx';
import { ChevronRightIcon } from '../../components/ui/icons.jsx';
import { FOCUS_RING_CLASS_NAME } from '../../components/ui/focusRing.js';
import { ACCIONES_CUENTA, TARJETA_PERFIL_CLASS_NAME } from './perfil.constants.js';

const filaClassName = 'flex min-h-16 items-center gap-3 px-4 py-3';

function ContenidoAccion({ accion, disponible }) {
  const { titulo, descripcion, Icono, peligro } = accion;

  return (
    <>
      <Icono className={`size-5 shrink-0 ${peligro ? 'text-danger' : 'text-muted'}`} />
      <span className="min-w-0 flex-1">
        <span className={`block font-semibold ${peligro ? 'text-danger' : ''}`}>{titulo}</span>
        <span className="block text-sm text-muted">{descripcion}</span>
      </span>
      {disponible ? (
        <ChevronRightIcon className="size-5 shrink-0 text-muted" />
      ) : (
        <Chip className="shrink-0">Próximamente</Chip>
      )}
    </>
  );
}

export function AccionesCuenta() {
  return (
    <ul className={`divide-y divide-border overflow-hidden ${TARJETA_PERFIL_CLASS_NAME}`}>
      {ACCIONES_CUENTA.map((accion) => (
        <li key={accion.id}>
          {accion.to ? (
            <Link
              to={accion.to}
              className={`${filaClassName} transition-colors duration-150 hover:bg-border/60 ${FOCUS_RING_CLASS_NAME}`}
            >
              <ContenidoAccion accion={accion} disponible />
            </Link>
          ) : (
            <div aria-disabled="true" className={`${filaClassName} opacity-70`}>
              <ContenidoAccion accion={accion} disponible={false} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
