import { Link } from 'react-router';
import { Switch } from '../../components/ui/Switch.jsx';
import { RUTAS } from '../../app/rutas.js';

const ID_SWITCH = 'solo-propias';
const ETIQUETA = 'Solo mis plataformas';

function TextoDelFiltro({ sinPlataformas, error }) {
  if (sinPlataformas) {
    return (
      <Link
        to={RUTAS.MIS_PLATAFORMAS}
        className="text-sm font-semibold text-link underline underline-offset-4"
      >
        Elegí tus plataformas
      </Link>
    );
  }

  if (error) {
    return <span className="text-sm text-muted">No pudimos cargar tus plataformas</span>;
  }

  return (
    <label htmlFor={ID_SWITCH} className="cursor-pointer text-foreground">
      {ETIQUETA}
    </label>
  );
}

export function FiltroPlataformasPropias({ filtro, activo, onChange }) {
  if (!filtro.visible) {
    return null;
  }

  return (
    <div className="space-y-2">
      <span className="block font-mono text-xs font-medium tracking-wide text-muted uppercase">
        Plataformas
      </span>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-2.75">
        <TextoDelFiltro sinPlataformas={filtro.sinPlataformas} error={filtro.error} />
        <Switch
          id={ID_SWITCH}
          checked={activo && filtro.disponible}
          disabled={!filtro.disponible}
          onChange={onChange}
          label={ETIQUETA}
        />
      </div>
    </div>
  );
}
