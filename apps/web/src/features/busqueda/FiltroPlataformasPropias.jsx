import { Link } from 'react-router';
import { Switch } from '../../components/ui/Switch.jsx';
import { LINK_CLASS_NAME } from '../../components/ui/focusRing.js';
import { RUTAS } from '../../app/rutas.js';

const ID_SWITCH = 'solo-propias';
const ETIQUETA = 'Solo mis plataformas';

function TextoDelFiltro({ sinPlataformas, error }) {
  if (sinPlataformas) {
    return (
      <Link
        to={RUTAS.MIS_PLATAFORMAS}
        className={`${LINK_CLASS_NAME} rounded-sm text-sm underline`}
      >
        Elegí tus plataformas
      </Link>
    );
  }

  if (error) {
    return <span className="text-sm text-muted">No pudimos cargar tus plataformas</span>;
  }

  return (
    <label htmlFor={ID_SWITCH} className="cursor-pointer text-sm text-muted">
      {ETIQUETA}
    </label>
  );
}

export function FiltroPlataformasPropias({ filtro, activo, onChange }) {
  if (!filtro.visible) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <TextoDelFiltro sinPlataformas={filtro.sinPlataformas} error={filtro.error} />
      <Switch
        id={ID_SWITCH}
        checked={activo && filtro.disponible}
        disabled={!filtro.disponible}
        onChange={onChange}
        label={ETIQUETA}
      />
    </div>
  );
}
