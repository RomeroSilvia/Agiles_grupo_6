import { ANIO_MAXIMO, ANIO_MINIMO } from '@buscador/shared/constants';
import { useBusqueda } from '../../hooks/useBusqueda.js';
import { Attribution } from '../../components/ui/Attribution.jsx';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

function esAnioValido(anio) {
  if (anio === '') {
    return true;
  }

  const valor = Number(anio);
  return /^\d{4}$/.test(anio) && valor >= ANIO_MINIMO && valor <= ANIO_MAXIMO;
}

function etiquetaTipo(tipo) {
  return tipo === 'pelicula' ? 'Película' : 'Serie';
}

function ResultadoCard({ resultado }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-surface-100 bg-surface-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-surface-700 dark:bg-surface-800">
      <div className="aspect-[2/3] bg-surface-100 dark:bg-surface-700">
        {resultado.posterPath ? (
          <img
            src={`${TMDB_IMAGE_BASE_URL}${resultado.posterPath}`}
            alt={`Póster de ${resultado.nombre}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-ink-muted dark:text-surface-200">
            Sin imagen disponible
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-700/30 dark:text-brand-100">
          {etiquetaTipo(resultado.tipo)}
        </span>
        <h2 className="line-clamp-2 text-base font-semibold text-surface-900 dark:text-surface-0">
          {resultado.nombre}
        </h2>
        <p className="text-sm text-ink-muted dark:text-surface-200">
          {resultado.anio ?? 'Año desconocido'}
          {resultado.puntuacion !== null && ` · ${resultado.puntuacion.toFixed(1)}/10`}
        </p>
      </div>
    </article>
  );
}

export function PaginaBusqueda() {
  const {
    filtros,
    setFiltros,
    buscar,
    resultados,
    totalResultados,
    isLoading,
    error,
    hasSearched,
  } = useBusqueda();

  function handleSubmit(event) {
    event.preventDefault();
    buscar(filtros);
  }

  function handleChange(event) {
    const nextFiltros = { ...filtros, [event.target.name]: event.target.value };
    setFiltros(nextFiltros);

    if (
      hasSearched &&
      event.target.name !== 'q' &&
      (event.target.name !== 'anio' || esAnioValido(nextFiltros.anio))
    ) {
      buscar(nextFiltros);
    }
  }

  return (
    <main className="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-0">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-5 py-8 sm:px-8 lg:py-12">
        <header className="max-w-2xl space-y-3">
          <p className="text-sm font-bold tracking-[0.2em] text-brand-600 dark:text-brand-100">
            STREAMLY
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Encontrá qué ver</h1>
          <p className="text-base leading-7 text-ink-muted sm:text-lg dark:text-surface-200">
            Buscá películas y series por título, tipo o año.
          </p>
        </header>

        <form
          aria-label="Buscar títulos"
          className="space-y-5 rounded-3xl border border-surface-100 bg-surface-0 p-5 shadow-sm sm:p-6 dark:border-surface-700 dark:bg-surface-800"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <label htmlFor="q" className="text-sm font-semibold">
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
              className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 transition outline-none placeholder:text-ink-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-900 dark:placeholder:text-surface-200"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <label htmlFor="tipo" className="text-sm font-semibold">
                Tipo
              </label>
              <select
                id="tipo"
                name="tipo"
                value={filtros.tipo}
                onChange={handleChange}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 transition outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-900"
              >
                <option value="">Todos</option>
                <option value="pelicula">Películas</option>
                <option value="serie">Series</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="anio" className="text-sm font-semibold">
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
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 transition outline-none placeholder:text-ink-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-900 dark:placeholder:text-surface-200"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-brand-500 px-6 py-3 font-semibold text-surface-0 transition hover:bg-brand-600 focus:ring-4 focus:ring-brand-500/30 focus:outline-none disabled:cursor-wait disabled:opacity-60"
            >
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        <section aria-live="polite" className="flex-1">
          {isLoading && (
            <p className="rounded-2xl border border-brand-100 bg-brand-50 p-5 text-brand-700 dark:border-brand-700/50 dark:bg-brand-700/20 dark:text-brand-100">
              Buscando títulos...
            </p>
          )}

          {!isLoading && error && (
            <p
              role="alert"
              className="rounded-2xl border border-danger-500/30 bg-danger-500/10 p-5 text-danger-500"
            >
              {error}
            </p>
          )}

          {!isLoading && !error && hasSearched && resultados.length === 0 && (
            <p className="rounded-2xl border border-surface-100 bg-surface-0 p-5 text-ink-muted dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200">
              No encontramos contenido disponible con esos filtros.
            </p>
          )}

          {!isLoading && !error && resultados.length > 0 && (
            <>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Resultados</h2>
                <p className="text-sm text-ink-muted dark:text-surface-200">
                  {totalResultados} {totalResultados === 1 ? 'título' : 'títulos'}
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
            </>
          )}
        </section>

        <footer>
          <Attribution />
        </footer>
      </div>
    </main>
  );
}
