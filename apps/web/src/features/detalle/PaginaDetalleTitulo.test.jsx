import { describe, it, expect, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { PaginaDetalleTitulo } from './PaginaDetalleTitulo.jsx';

const detallePelicula = {
  tmdbId: 1,
  tipo: 'pelicula',
  nombre: 'Dune',
  sinopsis: 'En un futuro lejano...',
  posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
  anio: 2021,
  puntuacion: 8.1,
};

function renderDetalle(path = '/titulos/pelicula/1', state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/" element={<p>Resultados de la búsqueda</p>} />
        <Route path="/titulos/:tipo/:tmdbId" element={<PaginaDetalleTitulo />} />
      </Routes>
    </MemoryRouter>,
  );
}

function configurarFetch(data = detallePelicula) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data }),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PaginaDetalleTitulo', () => {
  it('muestra la información principal del título', async () => {
    const fetchMock = configurarFetch();

    renderDetalle();

    expect(await screen.findByRole('heading', { level: 1, name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('En un futuro lejano...')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(screen.getByText('8.1/10')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Póster de Dune' })).toHaveAttribute(
      'src',
      detallePelicula.posterUrl,
    );
    expect(fetchMock.mock.calls[0][0].toString()).toContain('/api/titulos/pelicula/1');
  });

  it('muestra el estado de carga', async () => {
    let resolver;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolver = resolve;
        }),
      ),
    );

    renderDetalle();

    expect(screen.getByRole('status')).toHaveTextContent('Cargando detalle del título...');

    resolver({
      ok: true,
      json: async () => ({ data: detallePelicula }),
    });
    expect(await screen.findByRole('heading', { level: 1, name: 'Dune' })).toBeInTheDocument();
  });

  it('muestra el error de la API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { code: 'EXTERNAL_SERVICE', message: 'No se pudo consultar TMDB' },
        }),
      }),
    );

    renderDetalle();

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo consultar TMDB');
  });

  it('muestra mensajes explícitos para los campos faltantes', async () => {
    configurarFetch({
      tmdbId: 3,
      tipo: 'pelicula',
      nombre: null,
      sinopsis: null,
      posterUrl: null,
      anio: null,
      puntuacion: null,
    });

    renderDetalle('/titulos/pelicula/3');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Título no disponible' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Sin imagen disponible')).toBeInTheDocument();
    expect(screen.getByText('Sinopsis no disponible')).toBeInTheDocument();
    expect(screen.getByText('Año no disponible')).toBeInTheDocument();
    expect(screen.getByText('Puntuación no disponible')).toBeInTheDocument();
  });

  it('vuelve a la búsqueda conservando el estado de navegación', async () => {
    configurarFetch();
    renderDetalle('/titulos/pelicula/1', {
      busqueda: {
        filtros: { q: 'Dune', tipo: '', anio: '' },
        resultados: [detallePelicula],
        pagina: 1,
        totalResultados: 1,
        totalPaginas: 1,
        hasSearched: true,
        ultimaBusqueda: { q: 'Dune', tipo: '', anio: '' },
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'Dune' });
    fireEvent.click(screen.getByRole('link', { name: 'Volver a la búsqueda' }));

    expect(await screen.findByText('Resultados de la búsqueda')).toBeInTheDocument();
  });

  it('aborta la consulta anterior al navegar rápidamente a otro título', async () => {
    let llamada = 0;
    let resolverSegundoTitulo;
    const señales = [];
    const fetchMock = vi.fn((_url, options) => {
      llamada += 1;
      señales.push(options.signal);

      if (llamada === 1) {
        return new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            const error = new Error('Request abortado');
            error.name = 'AbortError';
            reject(error);
          });
        });
      }

      return new Promise((resolve) => {
        resolverSegundoTitulo = resolve;
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    function CambiarTitulo() {
      const navigate = useNavigate();
      return (
        <button type="button" onClick={() => navigate('/titulos/serie/2')}>
          Ver otro título
        </button>
      );
    }

    render(
      <MemoryRouter initialEntries={['/titulos/pelicula/1']}>
        <Routes>
          <Route
            path="/titulos/:tipo/:tmdbId"
            element={
              <>
                <PaginaDetalleTitulo />
                <CambiarTitulo />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver otro título' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(señales[0].aborted).toBe(true);

    resolverSegundoTitulo({
      ok: true,
      json: async () => ({
        data: { ...detallePelicula, tmdbId: 2, tipo: 'serie', nombre: 'The Office' },
      }),
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'The Office' }),
    ).toBeInTheDocument();
  });
});
