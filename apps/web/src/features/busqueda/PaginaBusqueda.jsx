import { busquedaSchema } from '@buscador/shared/schemas';
import { ANIO_MAXIMO, ANIO_MINIMO, TIPOS_TITULO } from '@buscador/shared/constants';
import { useBusqueda } from '../../hooks/useBusqueda.js';
import { ETIQUETAS_TIPO_TITULO } from './busqueda.constants.js';
import { ResultadoCard } from './ResultadoCard.jsx';

function esBusquedaValida(filtros) {
  return busquedaSchema.safeParse({
    q: filtros.q,
    tipo: filtros.tipo || undefined,
    anio: filtros.anio || undefined,
    pagina: 1,
  }).success;
}

export function PaginaBusqueda() {
  const {
    filtros,
    setFiltros,
    buscar,
    buscarConFiltros,
    cargarMas,
    resultados,
    pagina,
    totalResultados,
    totalPaginas,
    isLoading,
    isLoadingMore,
    error,
    hasSearched,
    ultimaBusqueda,
  } = useBusqueda();

  function handleSubmit(event) {
    event.preventDefault();
    buscar(filtros);
  }

  function handleChange(event) {
    const nextFiltros = { ...filtros, [event.target.name]: event.target.value };
    setFiltros(nextFiltros);

    const filtrosParaValidar = {
      ...nextFiltros,
      q: ultimaBusqueda?.q ?? '',
    };

    if (hasSearched && event.target.name !== 'q' && esBusquedaValida(filtrosParaValidar)) {
      buscarConFiltros(nextFiltros);
    }
  }

  const tituloBuscado = ultimaBusqueda?.q ?? filtros.q.trim();

  return (
    <>
      <header className="mb-12 max-w-2xl space-y-3">
        <p className="font-mono text-xs font-medium tracking-[0.2em] text-primary">STREAMLY</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Una búsqueda. Todas tus plataformas.
        </h1>
        <p className="text-base leading-7 text-muted sm:text-lg">
          Buscá películas y series por título, tipo o año.
        </p>
      </header>

      <form
        aria-label="Buscar títulos"
        className="mb-12 space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <label
            htmlFor="q"
            className="font-mono text-xs font-medium tracking-wide text-muted uppercase"
          >
            Título
          </label>
          <input
            id="q"
            name="q"
            type="search"
            value={filtros.q}
            onChange={handleChange}
            placeholder="Ej.: Dune, The Office..."
            required
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition outline-none placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="space-y-2">
            <label
              htmlFor="tipo"
              className="font-mono text-xs font-medium tracking-wide text-muted uppercase"
            >
              Tipo
            </label>
            <select
              id="tipo"
              name="tipo"
              value={filtros.tipo}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            >
              <option value="">Todos</option>
              {TIPOS_TITULO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {ETIQUETAS_TIPO_TITULO[tipo]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="anio"
              className="font-mono text-xs font-medium tracking-wide text-muted uppercase"
            >
              Año
            </label>
            <input
              id="anio"
              name="anio"
              type="number"
              min={ANIO_MINIMO}
              max={ANIO_MAXIMO}
              value={filtros.anio}
              onChange={handleChange}
              placeholder="Cualquier año"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground transition outline-none placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-hover focus:ring-4 focus:ring-primary/30 focus:outline-none disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      <section>
        {isLoading && !isLoadingMore && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-primary"
          >
            Buscando títulos...
          </p>
        )}

        {!isLoading && error && resultados.length === 0 && (
          <p
            role="alert"
            className="rounded-2xl border border-danger/30 bg-danger-surface p-5 text-danger"
          >
            {error}
          </p>
        )}

        {!isLoading && !error && hasSearched && resultados.length === 0 && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-border bg-surface p-5 text-muted"
          >
            No encontramos contenido disponible con esos filtros.
          </p>
        )}

        {resultados.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Resultados para &quot;{tituloBuscado}&quot;</h2>
              <p className="text-sm text-muted">
                Mostrando {resultados.length} de {totalResultados}{' '}
                {totalResultados === 1 ? 'título' : 'títulos'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {resultados.map((resultado) => (
                <ResultadoCard
                  key={`${resultado.tipo}-${resultado.tmdbId}`}
                  resultado={resultado}
                />
              ))}
            </div>
            {pagina < totalPaginas && (
              <>
                <button
                  type="button"
                  onClick={cargarMas}
                  disabled={isLoading}
                  className="mx-auto mt-8 block rounded-xl border border-primary px-6 py-3 font-semibold text-primary transition hover:bg-primary/10 focus:ring-4 focus:ring-primary/30 focus:outline-none disabled:cursor-wait disabled:opacity-60"
                >
                  {isLoadingMore ? 'Cargando...' : 'Cargar más'}
                </button>
                {error && (
                  <p
                    role="alert"
                    className="mx-auto mt-4 max-w-md rounded-2xl border border-danger/30 bg-danger-surface p-4 text-center text-danger"
                  >
                    {error}
                  </p>
                )}
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
