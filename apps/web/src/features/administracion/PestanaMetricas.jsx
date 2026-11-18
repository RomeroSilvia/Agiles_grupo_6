import { DIAS_POR_PERIODO_METRICAS } from '@buscador/shared/constants';
import { Alert } from '../../components/ui/Alert.jsx';
import { SegmentedControl } from '../../components/ui/SegmentedControl.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { LogoPlataforma } from '../plataformas/LogoPlataforma.jsx';
import { useCatalogoPlataformas } from '../plataformas/useCatalogoPlataformas.js';
import {
  NOTA_METRICAS,
  OPCIONES_PERIODO,
  RANKING_GENERO,
  RANKING_PLATAFORMA,
  RANKING_REGION,
  RANKING_TEXTOS,
  RANKING_TIPO,
  RANKINGS,
  TARJETAS_TOTALES,
} from './administracion.constants.js';
import { aItemsGenero, aItemsPlataforma, aItemsRegion, aItemsTexto } from './metricas.utils.js';
import { RankingBarras } from './RankingBarras.jsx';
import { RankingPorFuente } from './RankingPorFuente.jsx';
import { RankingTipo } from './RankingTipo.jsx';
import { TarjetaRanking } from './TarjetaRanking.jsx';
import { TarjetaTotal } from './TarjetaTotal.jsx';
import { useMetricasAdmin } from './useMetricasAdmin.js';
import { usePeriodoMetricas } from './usePeriodoMetricas.js';
import { useRecargarSesionSinAcceso } from './useRecargarSesionSinAcceso.js';

const COLUMNA_RANKINGS_CLASS_NAME = 'contents lg:flex lg:flex-col lg:gap-4';

function renderLogoPlataforma({ plataforma }) {
  return <LogoPlataforma plataforma={plataforma} size="small" />;
}

function MetricasCargando() {
  return (
    <div className="space-y-4">
      <p role="status" aria-live="polite" className="sr-only">
        Cargando métricas…
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TARJETAS_TOTALES.map(({ clave }) => (
          <Skeleton key={clave} shape="block" className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {RANKINGS.map(({ titulo }) => (
          <Skeleton key={titulo} shape="block" className="h-72" />
        ))}
      </div>
    </div>
  );
}

function Metricas({ totales, rankings, diasPeriodo }) {
  const catalogo = useCatalogoPlataformas();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TARJETAS_TOTALES.map(({ clave, claveNuevos, label, Icono }) => (
          <TarjetaTotal
            key={clave}
            label={label}
            Icono={Icono}
            valor={totales[clave]}
            nuevos={claveNuevos && totales[claveNuevos]}
            diasPeriodo={diasPeriodo}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className={COLUMNA_RANKINGS_CLASS_NAME}>
          <RankingPorFuente
            ranking={RANKING_GENERO}
            porFuente={rankings.genero}
            className="order-1"
          >
            {(ranking) => (
              <RankingBarras label={RANKING_GENERO.titulo} items={aItemsGenero(ranking)} />
            )}
          </RankingPorFuente>

          <RankingPorFuente
            ranking={RANKING_REGION}
            porFuente={rankings.region}
            className="order-3"
          >
            {(ranking) => (
              <RankingBarras label={RANKING_REGION.titulo} items={aItemsRegion(ranking)} />
            )}
          </RankingPorFuente>

          <TarjetaRanking
            titulo={RANKING_TEXTOS.titulo}
            descripcion={RANKING_TEXTOS.descripcion}
            className="order-5"
          >
            <RankingBarras
              label={RANKING_TEXTOS.titulo}
              items={aItemsTexto(rankings.textosBuscados)}
            />
          </TarjetaRanking>
        </div>

        <div className={COLUMNA_RANKINGS_CLASS_NAME}>
          <RankingPorFuente ranking={RANKING_TIPO} porFuente={rankings.tipo} className="order-2">
            {(ranking) => <RankingTipo ranking={ranking} />}
          </RankingPorFuente>

          <TarjetaRanking
            titulo={RANKING_PLATAFORMA.titulo}
            descripcion={RANKING_PLATAFORMA.descripcion}
            className="order-4"
          >
            {catalogo.error ? (
              <Alert onRetry={catalogo.reintentar}>{catalogo.error}</Alert>
            ) : catalogo.loading ? (
              <Skeleton shape="block" className="h-40" />
            ) : (
              <RankingBarras
                label={RANKING_PLATAFORMA.titulo}
                items={aItemsPlataforma(rankings.plataforma, catalogo.plataformasPorId)}
                renderIcono={renderLogoPlataforma}
              />
            )}
          </TarjetaRanking>
        </div>
      </div>

      <p className="text-xs text-muted">{NOTA_METRICAS}</p>
    </div>
  );
}

export function PestanaMetricas() {
  const { periodo, cambiarPeriodo } = usePeriodoMetricas();
  const { datos, isLoading, error, codigoError, reintentar } = useMetricasAdmin(periodo);
  const sinAcceso = useRecargarSesionSinAcceso(codigoError);

  return (
    <div className="space-y-5">
      <div className="sm:max-w-sm">
        <SegmentedControl
          legend="Período"
          name="periodo"
          value={periodo}
          options={OPCIONES_PERIODO}
          onChange={(evento) => cambiarPeriodo(evento.target.value)}
        />
      </div>

      {error && <Alert onRetry={sinAcceso ? undefined : reintentar}>{error}</Alert>}

      {isLoading && <MetricasCargando />}

      {datos && !isLoading && (
        <Metricas
          totales={datos.totales}
          rankings={datos.rankings}
          diasPeriodo={DIAS_POR_PERIODO_METRICAS[periodo]}
        />
      )}
    </div>
  );
}
