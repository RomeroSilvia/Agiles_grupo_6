import { Chip } from '../../components/ui/Chip.jsx';
import { TextButton } from '../../components/ui/TextButton.jsx';

export function FiltrosActivos({ filtros, onQuitar, onLimpiar }) {
  return (
    <div role="group" aria-label="Filtros activos" className="flex flex-wrap items-center gap-2">
      {filtros.map((filtro) => (
        <Chip
          key={filtro.clave}
          size="md"
          onRemove={() => onQuitar(filtro)}
          removeLabel={`Quitar ${filtro.etiqueta}`}
        >
          <span className="max-w-56 truncate">{filtro.etiqueta}</span>
        </Chip>
      ))}
      <TextButton onClick={onLimpiar} className="ml-1 text-sm text-link">
        Limpiar filtros
      </TextButton>
    </div>
  );
}
