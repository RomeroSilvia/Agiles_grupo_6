import { Switch } from '../../components/ui/Switch.jsx';
import { LogoPlataforma } from './LogoPlataforma.jsx';

const tarjetaClassName =
  'flex items-center gap-3.5 rounded-xl border border-border bg-surface px-4.5 py-4';

export function TarjetaPlataforma({ plataforma, seleccionada, onChange }) {
  return (
    <li className={tarjetaClassName}>
      <LogoPlataforma plataforma={plataforma} />
      <span className="flex-1 font-semibold">{plataforma.nombre}</span>
      <Switch
        checked={seleccionada}
        onChange={(activa) => onChange(plataforma.id, activa)}
        label={plataforma.nombre}
      />
    </li>
  );
}

export function TarjetaPlataformaCargando() {
  return (
    <li aria-hidden="true" className={`${tarjetaClassName} animate-pulse`}>
      <span className="size-10 shrink-0 rounded-lg bg-border" />
      <span className="h-4 w-32 flex-1 rounded bg-border" />
      <span className="h-6.5 w-11 shrink-0 rounded-full bg-border" />
    </li>
  );
}
