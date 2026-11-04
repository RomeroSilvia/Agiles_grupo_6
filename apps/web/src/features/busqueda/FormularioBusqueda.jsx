import { useId, useState } from 'react';
import { tieneFiltrosAvanzados } from '@buscador/shared/schemas';
import { BarraBusqueda } from './BarraBusqueda.jsx';
import { FiltrosActivos } from './FiltrosActivos.jsx';
import { listarFiltrosActivos } from './filtrosActivos.js';
import { PanelFiltros } from './PanelFiltros.jsx';

export function FormularioBusqueda({
  filtros,
  isLoading,
  onChange,
  onSubmit,
  onCambiarPersona,
  onCambiarNombrePersona,
  onLimpiarFiltros,
  onQuitarFiltro,
  generos,
  isLoadingGeneros,
  errorGeneros,
  generosCargados,
  onCargarGeneros,
  onReintentarGeneros,
}) {
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const panelFiltrosId = useId();
  const filtrosActivos = listarFiltrosActivos(filtros, generos);
  const hayFiltrosAvanzados = tieneFiltrosAvanzados(filtros);
  const hayFiltrosParaLimpiar = Boolean(
    filtros.tipo ||
    filtros.anio ||
    filtros.soloPropias ||
    hayFiltrosAvanzados ||
    filtros.actorNombre.trim() ||
    filtros.directorNombre.trim(),
  );
  const hayFiltrosSinTitulo = Boolean(
    filtros.tipo || filtros.anio || filtros.soloPropias || hayFiltrosAvanzados,
  );

  function quitarFiltro({ clave, esPersona }) {
    if (esPersona) {
      onCambiarPersona(clave, null, '');
      return;
    }
    onQuitarFiltro(clave);
  }

  return (
    <div className="mb-10 space-y-4">
      <form aria-label="Buscar títulos" className="space-y-3" onSubmit={onSubmit}>
        <BarraBusqueda
          titulo={filtros.q}
          tituloRequerido={!hayFiltrosSinTitulo}
          isLoading={isLoading}
          onChange={onChange}
          filtrosAbiertos={filtrosAbiertos}
          cantidadFiltros={filtrosActivos.length}
          panelFiltrosId={panelFiltrosId}
          onAlternarFiltros={() => setFiltrosAbiertos((abiertos) => !abiertos)}
        />
        {hayFiltrosParaLimpiar && (
          <FiltrosActivos
            filtros={filtrosActivos}
            onQuitar={quitarFiltro}
            onLimpiar={onLimpiarFiltros}
          />
        )}
        <PanelFiltros
          id={panelFiltrosId}
          abierto={filtrosAbiertos}
          filtros={filtros}
          generos={{
            lista: generos,
            isLoading: isLoadingGeneros,
            error: errorGeneros,
            cargados: generosCargados,
            cargar: onCargarGeneros,
            reintentar: onReintentarGeneros,
          }}
          isLoading={isLoading}
          onChange={onChange}
          onCambiarPersona={onCambiarPersona}
          onCambiarNombrePersona={onCambiarNombrePersona}
        />
      </form>
    </div>
  );
}
