import { Alert } from '../../components/ui/Alert.jsx';
import { AttributionDisponibilidad } from '../../components/ui/Attribution.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { LoadMoreButton } from '../../components/ui/LoadMoreButton.jsx';
import { SectionTitle } from '../../components/ui/SectionTitle.jsx';
import { CardsCargando } from '../busqueda/CardsCargando.jsx';
import { EstadoSinResultadosPropios } from '../busqueda/EstadoSinResultadosPropios.jsx';
import { GrillaResultados } from '../busqueda/GrillaResultados.jsx';
import { ResultadoCard } from '../busqueda/ResultadoCard.jsx';

function textoCantidad(cantidad, soloPropias) {
  const titulos = `${cantidad} ${cantidad === 1 ? 'título' : 'títulos'}`;
  return soloPropias ? `Mostrando ${titulos} de tus plataformas` : `Mostrando ${titulos}`;
}

export function ResultadosAnimo({
  nombreAnimo,
  resultados,
  soloPropias,
  verificacionIncompleta,
  cargando,
  cargandoMas,
  error,
  hayMasPaginas,
  onCargarMas,
  onReintentar,
  onVerTodos,
  acciones,
}) {
  const hayResultados = !cargando && resultados.length > 0;

  return (
    <section aria-labelledby="titulo-resultados-animo" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <SectionTitle id="titulo-resultados-animo">{nombreAnimo}</SectionTitle>
          {hayResultados && (
            <p role="status" aria-live="polite" className="text-sm text-muted">
              {textoCantidad(resultados.length, soloPropias)}
            </p>
          )}
        </div>
        {acciones}
      </div>

      {cargando && (
        <>
          <p role="status" aria-live="polite" className="sr-only">
            {soloPropias ? 'Buscando en tus plataformas...' : 'Buscando sugerencias...'}
          </p>
          <GrillaResultados>
            <CardsCargando />
          </GrillaResultados>
        </>
      )}

      {!cargando && !hayResultados && error && <Alert onRetry={onReintentar}>{error}</Alert>}

      {!cargando && !hayResultados && !error && soloPropias && (
        <EstadoSinResultadosPropios
          verificacionIncompleta={verificacionIncompleta}
          puedeSeguirBuscando={hayMasPaginas}
          buscando={cargandoMas}
          onSeguirBuscando={onCargarMas}
          onReintentar={onReintentar}
          onVerTodos={onVerTodos}
        />
      )}

      {!cargando && !hayResultados && !error && !soloPropias && (
        <Card padding="lg" className="text-muted">
          <p role="status" aria-live="polite">
            No encontramos títulos para este estado de ánimo. Probá con otro.
          </p>
        </Card>
      )}

      {hayResultados && (
        <>
          {soloPropias && verificacionIncompleta && (
            <Alert tone="info" onRetry={onReintentar} retryDisabled={cargandoMas}>
              No pudimos verificar todos los títulos. Puede haber más disponibles en tus
              plataformas.
            </Alert>
          )}
          <GrillaResultados>
            {resultados.map((resultado) => (
              <ResultadoCard key={`${resultado.tipo}-${resultado.tmdbId}`} resultado={resultado} />
            ))}
            {cargandoMas && <CardsCargando />}
          </GrillaResultados>
          {resultados.some((resultado) => resultado.plataformas?.length > 0) && (
            <AttributionDisponibilidad />
          )}
          {error && (
            <Alert className="mx-auto max-w-md" onRetry={onCargarMas} retryDisabled={cargandoMas}>
              {error}
            </Alert>
          )}
          {hayMasPaginas && !error && (
            <LoadMoreButton className="mt-3" onClick={onCargarMas} loading={cargandoMas} />
          )}
        </>
      )}
    </section>
  );
}
