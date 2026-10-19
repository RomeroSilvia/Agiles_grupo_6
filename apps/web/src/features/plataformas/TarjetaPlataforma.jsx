import { Switch } from '../../components/ui/Switch.jsx';
import { CARD_CLASS_NAME } from '../../components/ui/surface.js';
import { LogoPlataforma } from './LogoPlataforma.jsx';

export const tarjetaClassName = `flex items-center gap-3.5 px-4.5 py-4 ${CARD_CLASS_NAME}`;

export function TarjetaPlataforma({ plataforma, seleccionada, guardando, onChange }) {
  return (
    <li className={tarjetaClassName}>
      <LogoPlataforma plataforma={plataforma} />
      <span className="flex-1 font-semibold">{plataforma.nombre}</span>
      <Switch
        checked={seleccionada}
        disabled={guardando}
        onChange={(activa) => onChange(plataforma.id, activa)}
        label={plataforma.nombre}
      />
    </li>
  );
}
