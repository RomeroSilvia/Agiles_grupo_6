import { Link } from 'react-router';
import { Switch } from '../../components/ui/Switch.jsx';
import { RUTAS } from '../../app/rutas.js';
import { ETIQUETA_BUSQUEDA_CLASS_NAME } from './busqueda.styles.js';

const ID_SWITCH = 'solo-propias';
const ETIQUETA = 'Solo mis plataformas';

function TextoDelFiltro({ sinPlataformas, error, bloqueadoPorFiltrosAvanzados }) {
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

  if (bloqueadoPorFiltrosAvanzados) {
    return (
      <span className="text-sm text-muted">
        Desactivado al filtrar por género, actor o director.
      </span>
    );
  }

  return (
    <label htmlFor={ID_SWITCH} className="cursor-pointer text-foreground">
      {ETIQUETA}
    </label>
  );
}

export function FiltroPlataformasPropias({
  filtro,
  activo,
  onChange,
  bloqueadoPorFiltrosAvanzados = false,
}) {
  if (!filtro.visible) {
    return null;
  }

  return (
    <div className="space-y-2">
      <span className={ETIQUETA_BUSQUEDA_CLASS_NAME}>Plataformas</span>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-2.75">
        <TextoDelFiltro
          sinPlataformas={filtro.sinPlataformas}
          error={filtro.error}
          bloqueadoPorFiltrosAvanzados={bloqueadoPorFiltrosAvanzados}
        />
        <Switch
          id={ID_SWITCH}
          checked={activo && filtro.disponible && !bloqueadoPorFiltrosAvanzados}
          disabled={!filtro.disponible || bloqueadoPorFiltrosAvanzados}
          onChange={onChange}
          label={ETIQUETA}
        />
      </div>
    </div>
  );
}
