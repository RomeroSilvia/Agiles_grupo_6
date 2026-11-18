import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { ESTADOS_ANIMO } from '@buscador/shared/constants';
import { Alert } from '../../components/ui/Alert.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { FiltroPlataformasPropias } from '../busqueda/FiltroPlataformasPropias.jsx';
import { useFiltroPlataformasPropias } from '../busqueda/useFiltroPlataformasPropias.js';
import { ResultadosAnimo } from './ResultadosAnimo.jsx';
import { SelectorAnimo } from './SelectorAnimo.jsx';
import { useBusquedaAnimo } from './useBusquedaAnimo.js';

const PARAMETRO_ANIMO = 'animo';
const PARAMETRO_PROPIAS = 'propias';

export function PaginaAnimo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const animoEnUrl = searchParams.get(PARAMETRO_ANIMO);
  const estadoAnimo = ESTADOS_ANIMO.find(({ id }) => id === animoEnUrl) ?? null;
  const animo = estadoAnimo?.id ?? null;
  const propiasPedidas = searchParams.get(PARAMETRO_PROPIAS) === 'true';

  const filtroPropias = useFiltroPlataformasPropias();
  // El filtro solo se aplica si el usuario tiene sesión y plataformas elegidas. Si lo pidió por
  // la URL, se espera a saberlo antes de buscar para no mostrar primero todos los resultados.
  const soloPropias = propiasPedidas && filtroPropias.disponible;
  const esperandoFiltro = propiasPedidas && !filtroPropias.resuelto;
  const firmaPlataformas = soloPropias ? filtroPropias.firma : '';

  const busqueda = useBusquedaAnimo();
  const { buscar, limpiar } = busqueda;

  useEffect(() => {
    if (!animo) {
      limpiar();
      return;
    }
    if (!esperandoFiltro) {
      buscar({ animo, soloPropias, firmaPlataformas });
    }
  }, [animo, soloPropias, firmaPlataformas, esperandoFiltro, buscar, limpiar]);

  function actualizarUrl(cambios) {
    const params = new URLSearchParams(searchParams);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) {
        params.set(clave, valor);
      } else {
        params.delete(clave);
      }
    }
    setSearchParams(params, { replace: true, preventScrollReset: true });
  }

  const cambiarPropias = (activo) => actualizarUrl({ [PARAMETRO_PROPIAS]: activo ? 'true' : '' });

  const { consulta } = busqueda;
  const consultaActual =
    consulta?.animo === animo &&
    consulta?.soloPropias === soloPropias &&
    consulta?.firmaPlataformas === firmaPlataformas;

  return (
    <>
      <PageHeader
        size="hero"
        titulo="¿Qué tenés ganas de ver?"
        descripcion="Elegí cómo te sentís y te sugerimos películas y series que van con ese momento."
        className="mb-8"
      />

      <SelectorAnimo valor={animo} onChange={(id) => actualizarUrl({ [PARAMETRO_ANIMO]: id })} />

      <div className="mt-8">
        {estadoAnimo ? (
          <ResultadosAnimo
            nombreAnimo={estadoAnimo.nombre}
            resultados={consultaActual ? busqueda.resultados : []}
            soloPropias={soloPropias}
            verificacionIncompleta={busqueda.verificacionIncompleta}
            cargando={!consultaActual || busqueda.cargando}
            cargandoMas={busqueda.cargandoMas}
            error={busqueda.error}
            hayMasPaginas={busqueda.hayMasPaginas}
            onCargarMas={busqueda.cargarMas}
            onReintentar={busqueda.reintentar}
            onVerTodos={() => cambiarPropias(false)}
            acciones={
              <FiltroPlataformasPropias
                filtro={filtroPropias}
                activo={propiasPedidas}
                onChange={cambiarPropias}
              />
            }
          />
        ) : animoEnUrl ? (
          <Alert tone="info">Ese estado de ánimo no existe. Elegí uno de la lista.</Alert>
        ) : (
          <p className="text-muted">Elegí un estado de ánimo para ver sugerencias.</p>
        )}
      </div>
    </>
  );
}
