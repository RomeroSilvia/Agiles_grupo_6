import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useCiudadCine } from '../../contexts/ciudadCine/CiudadCineContext.js';
import { SelectorCiudadCine } from './SelectorCiudadCine.jsx';
import { ListaFunciones } from './ListaFunciones.jsx';
import { useFuncionesCine } from './useFuncionesCine.js';

export function SeccionFunciones({ tmdbId }) {
  const { idCiudadSeleccionada, loading: cargandoCiudades } = useCiudadCine();
  const { data, loading, error, consultar } = useFuncionesCine({
    tmdbId,
    ciudadId: cargandoCiudades ? null : idCiudadSeleccionada,
  });
  return (
    <section aria-labelledby="funciones-cine-titulo" className="space-y-4">
      <SectionTitle id="funciones-cine-titulo">Cines y funciones</SectionTitle>
      <SelectorCiudadCine />
      {!idCiudadSeleccionada && (
        <p className="text-sm text-muted">
          Elegí una ciudad para consultar funciones de esta película.
        </p>
      )}
      {idCiudadSeleccionada && (
        <Button
          variant="outline"
          fullWidth={false}
          onClick={consultar}
          disabled={loading || cargandoCiudades}
        >
          Consultar funciones
        </Button>
      )}
      {loading && (
        <div role="status" className="space-y-2">
          <p>Consultando funciones…</p>
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {error && <Alert onRetry={consultar}>{error}</Alert>}
      {data && (
        <>
          <p className="text-sm text-muted">
            Horizonte informado: {data.desde} a {data.hasta}. Zona horaria:{' '}
            {data.ciudad.zonaHoraria}. Cobertura de las fuentes consultadas; puede no incluir todos
            los cines.
          </p>
          {data.advertencias.map((aviso, indice) => (
            <Alert key={`${aviso.code}:${indice}`} tone="info">
              {aviso.message}
            </Alert>
          ))}
          {data.estado === 'sin_cobertura' && (
            <Alert tone="info">No hay información disponible para la ciudad seleccionada.</Alert>
          )}
          {data.estado === 'sin_funciones' && (
            <p role="status">
              No se encontraron funciones registradas para esta película y ciudad.
            </p>
          )}
          {data.estado === 'incompleta' && (
            <Alert tone="info">
              La información de funciones es incompleta. Los datos recibidos no confirman la
              ausencia de exhibición.
            </Alert>
          )}
          <ListaFunciones cines={data.cines} funciones={data.funciones} />
          <p className="text-xs text-muted">
            Horarios de SerpApi y, cuando está habilitado, Butaca / Cinemark. Consultados:{' '}
            <time dateTime={data.consultadoEn}>{data.consultadoEn}</time>.
          </p>
        </>
      )}
    </section>
  );
}
