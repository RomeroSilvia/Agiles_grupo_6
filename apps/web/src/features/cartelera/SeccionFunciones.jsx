import { useState } from 'react';
import { ESTADO_FUNCIONES_CINE } from '@buscador/shared/constants';
import { formatearConsultaCine } from './fechasCine.js';
import { formatearFechaCivil } from '../../utils/formatearFecha.js';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useCiudadCine } from '../../contexts/ciudadCine/CiudadCineContext.js';
import { SelectorCiudadCine } from './SelectorCiudadCine.jsx';
import { FuncionesFiltradas } from './FuncionesFiltradas.jsx';
import { AccionSitioCine } from './AccionSitioCine.jsx';
import { useFuncionesCine } from './useFuncionesCine.js';

export function SeccionFunciones({ tmdbId }) {
  const [cambiarCiudad, setCambiarCiudad] = useState(false);
  const { idCiudadSeleccionada, ciudadSeleccionada, loading: cargandoCiudades } = useCiudadCine();
  const { data, loading, error, consultar } = useFuncionesCine({
    tmdbId,
    ciudadId: cargandoCiudades ? null : idCiudadSeleccionada,
  });
  return (
    <section aria-labelledby="funciones-cine-titulo" className="space-y-4">
      <SectionTitle id="funciones-cine-titulo">Cines y funciones</SectionTitle>
      {idCiudadSeleccionada && !cambiarCiudad ? (
        <div className="flex flex-wrap items-center gap-3">
          <p>Ciudad: {ciudadSeleccionada?.nombre}</p>
          <Button variant="outline" fullWidth={false} onClick={() => setCambiarCiudad(true)}>
            Cambiar ciudad
          </Button>
        </div>
      ) : (
        <SelectorCiudadCine onSeleccionar={() => setCambiarCiudad(false)} />
      )}
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
            Funciones del {formatearFechaCivil(data.desde)} al {formatearFechaCivil(data.hasta)}.
            Horarios locales de {data.ciudad.nombre}. La cobertura puede no incluir todos los cines.
          </p>
          {data.advertencias.map((aviso, indice) => (
            <Alert key={`${aviso.code}:${indice}`} tone="info">
              {aviso.message}
            </Alert>
          ))}
          {data.estado === ESTADO_FUNCIONES_CINE.SIN_COBERTURA && (
            <Alert tone="info">No hay información disponible para la ciudad seleccionada.</Alert>
          )}
          {data.estado === ESTADO_FUNCIONES_CINE.SIN_FUNCIONES && (
            <p role="status">
              No se encontraron funciones registradas para esta película y ciudad.
            </p>
          )}
          {data.estado === ESTADO_FUNCIONES_CINE.INCOMPLETA && (
            <Alert tone="info">
              La información de funciones es incompleta. Los datos recibidos no confirman la
              ausencia de exhibición.
            </Alert>
          )}
          <p className="text-xs text-muted">
            Horarios de{' '}
            {data.fuentes.map((fuente) => fuente.nombre ?? 'la fuente consultada').join(', ')}.
            Consultados:{' '}
            <time dateTime={data.consultadoEn}>
              {formatearConsultaCine(data.consultadoEn, data.ciudad.zonaHoraria)}
            </time>
            .
          </p>
        </>
      )}
      <FuncionesFiltradas
        key={`${tmdbId}:${idCiudadSeleccionada ?? ''}`}
        data={data}
        renderAccion={({ cine, funcion }) => <AccionSitioCine cine={cine} funcion={funcion} />}
      />
    </section>
  );
}
