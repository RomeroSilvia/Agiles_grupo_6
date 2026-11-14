import { Alert } from '../../components/ui/Alert.jsx';
import { FiltrosFunciones } from './FiltrosFunciones.jsx';
import { ListaFunciones } from './ListaFunciones.jsx';
import { useFiltrosFunciones } from './useFiltrosFunciones.js';

export function FuncionesFiltradas({ data, renderAccion }) {
  const filtros = useFiltrosFunciones(data);
  if (!data) return null;
  return (
    <div className="space-y-4">
      {filtros.aviso && <Alert tone="info">{filtros.aviso}</Alert>}
      {filtros.error && <Alert>{filtros.error}</Alert>}
      {data.funciones.length > 0 && (
        <>
          <FiltrosFunciones {...filtros} />
          {filtros.funciones.length === 0 && (
            <p role="status">
              No se encontraron funciones para estos filtros
              {data.estado === 'incompleta' ? ' en los datos recibidos' : ''}.
            </p>
          )}
          <ListaFunciones
            cines={data.cines}
            funciones={filtros.funciones}
            renderAccion={renderAccion}
          />
        </>
      )}
    </div>
  );
}
