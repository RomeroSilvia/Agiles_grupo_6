import { describe, it, expect, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { RegionContext } from '../../contexts/region/RegionContext.js';
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

const disponibilidad = {
  region: 'BR',
  ofertas: [
    {
      tipoOferta: 'suscripcion',
      plataformas: [{ tmdbProviderId: 8, nombre: 'Netflix', logoPath: '/n.jpg' }],
    },
  ],
  enlaceTmdb: 'https://www.themoviedb.org/movie/1/watch?locale=BR',
};

const regionDetectada = { region: 'BR', source: 'ip', loading: false };

function renderDetalle(path = '/titulos/pelicula/1', state, regionState = regionDetectada) {
  return render(
    <RegionContext.Provider value={regionState}>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <Routes>
          <Route path="/" element={<p>Resultados de la búsqueda</p>} />
          <Route path="/titulos/:tipo/:tmdbId" element={<PaginaDetalleTitulo />} />
        </Routes>
      </MemoryRouter>
    </RegionContext.Provider>,
  );
}

function configurarFetch(data = detallePelicula) {
  const fetchMock = vi.fn().mockImplementation(async (input) => {
    const pathname = new URL(input.toString()).pathname;
    return {
      ok: true,
      json: async () => ({ data: pathname.endsWith('/disponibilidad') ? disponibilidad : data }),
    };
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
    expect(await screen.findByText('Netflix')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Logo de Netflix' })).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w92/n.jpg',
    );
    expect(screen.getByRole('heading', { name: 'Disponibilidad en BR' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver opciones en TMDB' })).toHaveAttribute(
      'href',
      disponibilidad.enlaceTmdb,
    );
    const consulta = fetchMock.mock.calls.find(([input]) =>
      input.toString().includes('/disponibilidad'),
    );
    expect(new URL(consulta[0]).searchParams.get('region')).toBe('BR');
  });

  it('identifica cuando muestra la región predeterminada', async () => {
    configurarFetch();
    renderDetalle('/titulos/pelicula/1', undefined, {
      region: 'AR',
      source: 'default',
      loading: false,
    });

    expect(
      await screen.findByText(
        'No pudimos detectar tu región. Mostramos la región predeterminada AR.',
      ),
    ).toBeInTheDocument();
  });

  it('espera a conocer la región antes de mostrarla en el título o consultar disponibilidad', async () => {
    const fetchMock = configurarFetch();
    renderDetalle('/titulos/pelicula/1', undefined, {
      region: 'AR',
      source: 'default',
      loading: true,
    });

    expect(await screen.findByRole('heading', { name: 'Disponibilidad' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Disponibilidad en AR' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Detectando región...');
    expect(
      fetchMock.mock.calls.every(([input]) => !input.toString().includes('/disponibilidad')),
    ).toBe(true);
  });

  it('muestra el estado de carga', async () => {
    let resolver;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input) =>
        input.toString().includes('/disponibilidad')
          ? Promise.resolve({ ok: true, json: async () => ({ data: disponibilidad }) })
          : new Promise((resolve) => {
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

  it('aborta la consulta anterior al navegar rápidamente a otro título', async () => {
    let llamada = 0;
    let resolverSegundoTitulo;
    const señales = [];
    const fetchMock = vi.fn((url, options) => {
      if (url.toString().includes('/disponibilidad')) {
        return Promise.resolve({ ok: true, json: async () => ({ data: disponibilidad }) });
      }
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
      <RegionContext.Provider value={regionDetectada}>
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
        </MemoryRouter>
      </RegionContext.Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver otro título' }));

    await waitFor(() => expect(llamada).toBe(2));
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
