import {
  ESTADOS_USUARIO,
  MAX_LARGO_BUSQUEDA_MAIL,
  REGIONES_SOPORTADAS,
} from '@buscador/shared/constants';
import { SearchField } from '../../components/ui/SearchField.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { ETIQUETAS_ESTADO_USUARIO } from './administracion.constants.js';

export function FiltrosUsuarios({ mail, region, estado, onCambiarMail, onCambiarFiltro }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_auto_auto]">
      <div className="col-span-2 md:col-span-1">
        <SearchField
          aria-label="Buscar por mail"
          placeholder="Buscar por mail…"
          maxLength={MAX_LARGO_BUSQUEDA_MAIL}
          value={mail}
          onChange={(event) => onCambiarMail(event.target.value)}
        />
      </div>
      <Select
        aria-label="Región"
        value={region ?? ''}
        onChange={(event) => onCambiarFiltro('region', event.target.value)}
      >
        <option value="">Todas las regiones</option>
        {REGIONES_SOPORTADAS.map(({ codigo, nombre }) => (
          <option key={codigo} value={codigo}>
            {nombre}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Estado"
        value={estado ?? ''}
        onChange={(event) => onCambiarFiltro('estado', event.target.value)}
      >
        <option value="">Todos los estados</option>
        {ESTADOS_USUARIO.map((valor) => (
          <option key={valor} value={valor}>
            {ETIQUETAS_ESTADO_USUARIO[valor]}
          </option>
        ))}
      </Select>
    </div>
  );
}
