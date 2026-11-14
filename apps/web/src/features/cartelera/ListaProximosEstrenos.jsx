import { useState } from 'react';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { ResultadoCard } from '../busqueda/ResultadoCard.jsx';
import { CardsCargando, GrillaResultados } from '../busqueda/ResultadosBusqueda.jsx';
import { FechaEstrenoCine } from './FechaEstrenoCine.jsx';
import { useProximosEstrenos } from './useProximosEstrenos.js';

export function ListaProximosEstrenos() {
  const { data, loading, error, consulta, consultar, reintentar } = useProximosEstrenos();
  const [desde, setDesde] = useState(consulta.desde);
  const [hasta, setHasta] = useState(consulta.hasta);
  const [errorFormulario, setErrorFormulario] = useState('');
  return (
    <section aria-label="Próximos estrenos" className="space-y-5">
      <PageHeader
        titulo="Próximos estrenos"
        descripcion="Fechas de estreno en salas de Argentina informadas por TMDB."
      />
      <form
        className="grid gap-3 md:grid-cols-3 md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setErrorFormulario(consultar({ desde, hasta, pagina: 1 }));
        }}
      >
        <TextField
          label="Desde"
          type="date"
          value={desde}
          onChange={(event) => setDesde(event.target.value)}
          required
        />
        <TextField
          label="Hasta"
          type="date"
          value={hasta}
          onChange={(event) => setHasta(event.target.value)}
          required
        />
        <Button type="submit">Consultar período</Button>
      </form>
      {errorFormulario && <Alert>{errorFormulario}</Alert>}
      <p className="text-sm text-muted">
        Período consultado: {consulta.desde} a {consulta.hasta} (hora argentina).
      </p>
      {loading && (
        <>
          <p role="status">Cargando próximos estrenos…</p>
          <GrillaResultados>
            <CardsCargando />
          </GrillaResultados>
        </>
      )}
      {error && <Alert onRetry={reintentar}>{error}</Alert>}
      {data && (
        <>
          {!data.resultados.length && (
            <p role="status">No se encontraron próximos estrenos para el período consultado.</p>
          )}
          <GrillaResultados>
            {data.resultados.map((pelicula) => (
              <ResultadoCard
                key={pelicula.tmdbId}
                resultado={pelicula}
                contenidoAdicional={<FechaEstrenoCine pelicula={pelicula} />}
              />
            ))}
          </GrillaResultados>
          {data.totalPaginas > 1 && (
            <nav aria-label="Páginas de estrenos" className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                fullWidth={false}
                disabled={data.pagina <= 1}
                onClick={() => consultar({ ...consulta, pagina: data.pagina - 1 })}
              >
                Anterior
              </Button>
              <span>
                Página {data.pagina} de {data.totalPaginas}
              </span>
              <Button
                variant="outline"
                fullWidth={false}
                disabled={data.pagina >= data.totalPaginas}
                onClick={() => consultar({ ...consulta, pagina: data.pagina + 1 })}
              >
                Siguiente
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
