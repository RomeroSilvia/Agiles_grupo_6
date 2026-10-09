import { describe, it, expect, afterEach, vi } from 'vitest';
import { TIPO_OFERTA } from '@buscador/shared/constants';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { PaginaDetalleTitulo } from './PaginaDetalleTitulo.jsx';
import { PlataformasPropiasContext } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';
import { RegionProvider } from '../../contexts/region/RegionProvider.jsx';
import { SessionContext } from '../../contexts/session/SessionContext.js';

const SIN_SESION = { user: null, loading: false };
const CON_SESION = { user: { id: 'u1', email: 'ana@mail.com' }, loading: false };

function plataformasPropias(ids = [], overrides = {}) {
  return { seleccionadas: new Set(ids), loading: false, error: '', ...overrides };
}

const detallePelicula = {
  tmdbId: 1,
  tipo: 'pelicula',
  nombre: 'Dune',
  sinopsis: 'En un futuro lejano...',
  posterUrl: 'https://image.tmdb.org/t/p/w500/dune.jpg',
  anio: 2021,
  puntuacion: 8.1,
};

function renderDetalle(
  path = '/titulos/pelicula/1',
  state,
  { sesion = SIN_SESION, propias = plataformasPropias() } = {},
) {
  return render(
    <SessionContext.Provider value={sesion}>
      <PlataformasPropiasContext.Provider value={propias}>
        <RegionProvider>
          <MemoryRouter initialEntries={[{ pathname: path, state }]}>
            <Routes>
              <Route path="/" element={<p>Resultados de la búsqueda</p>} />
              <Route path="/titulos/:tipo/:tmdbId" element={<PaginaDetalleTitulo />} />
            </Routes>
          </MemoryRouter>
        </RegionProvider>
      </PlataformasPropiasContext.Provider>
    </SessionContext.Provider>,
  );
}

function respuestaDisponibilidad(region = 'AR', plataformas = []) {
  return {
    region,
    ofertas: plataformas.length ? [{ tipoOferta: TIPO_OFERTA.SUSCRIPCION, plataformas }] : [],
    enlaceTmdb: null,
  };
}

function configurarFetch(
  data = detallePelicula,
  disponibilidad = respuestaDisponibilidad(),
  regionDetectada = { region: 'AR', source: 'ip' },
) {
  const fetchMock = vi.fn().mockImplementation((url) => {
    const urlStr = url.toString();
    if (urlStr.includes('/disponibilidad')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: disponibilidad }),
      });
    }
    if (urlStr.includes('/region')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: regionDetectada }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ data }),
    });
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

  it('usa la región detectada por IP y espera a conocerla antes de consultar disponibilidad', async () => {
    let resolverRegion;
    const fetchMock = vi.fn((url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/region')) {
        return new Promise((resolve) => {
          resolverRegion = resolve;
        });
      }
      if (urlStr.includes('/disponibilidad')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: respuestaDisponibilidad('BR') }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: detallePelicula }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderDetalle();

    expect(await screen.findByRole('heading', { level: 1, name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Detectando región...');
    expect(fetchMock.mock.calls.every(([url]) => !url.toString().includes('/disponibilidad'))).toBe(
      true,
    );

    await waitFor(() => expect(resolverRegion).toBeDefined());
    await act(async () => {
      resolverRegion({
        ok: true,
        json: async () => ({ data: { region: 'BR', source: 'ip' } }),
      });
    });

    await waitFor(() => {
      const disponibilidadRequest = fetchMock.mock.calls.find(([url]) =>
        url.toString().includes('/disponibilidad'),
      );
      expect(disponibilidadRequest).toBeDefined();
      expect(new URL(disponibilidadRequest[0]).searchParams.get('region')).toBe('BR');
    });
    expect(screen.getByLabelText('Región de disponibilidad: BR')).toBeInTheDocument();
  });

  it('avisa cuando usa la región predeterminada porque no pudo detectar la región por IP', async () => {
    configurarFetch(detallePelicula, respuestaDisponibilidad(), {
      region: 'AR',
      source: 'default',
    });

    renderDetalle();

    expect(
      await screen.findByText(
        'No pudimos detectar tu región. Mostramos la región predeterminada AR.',
      ),
    ).toBeInTheDocument();
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

  it('aborta la consulta anterior al navegar rápidamente a otro título', async () => {
    let llamada = 0;
    let resolverSegundoTitulo;
    const señales = [];
    const fetchMock = vi.fn((url, options) => {
      const urlStr = url?.toString() ?? '';
      if (urlStr.includes('/region')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { region: 'AR', source: 'ip' } }),
        });
      }
      if (urlStr.includes('/disponibilidad')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: respuestaDisponibilidad() }),
        });
      }

      llamada += 1;
      señales.push(options?.signal);

      if (llamada === 1) {
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => {
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
      <SessionContext.Provider value={SIN_SESION}>
        <PlataformasPropiasContext.Provider value={plataformasPropias()}>
          <RegionProvider>
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
          </RegionProvider>
        </PlataformasPropiasContext.Provider>
      </SessionContext.Provider>,
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

  describe('Disponibilidad de plataformas (E1HU2)', () => {
    it('muestra una única plataforma cuando el título está disponible en ella (Escenario 1)', async () => {
      configurarFetch(
        detallePelicula,
        respuestaDisponibilidad('AR', [
          {
            id: 1,
            tmdbProviderId: 8,
            nombre: 'Netflix',
            logoPath: '/netflix.jpg',
            urlHome: 'https://www.netflix.com',
          },
        ]),
      );

      renderDetalle();

      expect(
        await screen.findByRole('heading', { level: 2, name: /Plataformas disponibles/i }),
      ).toBeInTheDocument();
      expect(await screen.findByText('Netflix')).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /Netflix/i });
      expect(link).toHaveAttribute('href', 'https://www.netflix.com');
      expect(screen.getByRole('img', { name: /Logo de Netflix/i })).toBeInTheDocument();
    });

    it('muestra todas las plataformas cuando el título está en varias plataformas (Escenario 2)', async () => {
      configurarFetch(
        detallePelicula,
        respuestaDisponibilidad('AR', [
          {
            id: 1,
            tmdbProviderId: 8,
            nombre: 'Netflix',
            logoPath: '/netflix.jpg',
            urlHome: 'https://www.netflix.com',
          },
          {
            id: 2,
            tmdbProviderId: 119,
            nombre: 'Amazon Prime Video',
            logoPath: '/prime.jpg',
            urlHome: 'https://www.primevideo.com',
          },
        ]),
      );

      renderDetalle();

      expect(await screen.findByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Amazon Prime Video')).toBeInTheDocument();
    });

    it('muestra la modalidad de cada oferta y el enlace de TMDB', async () => {
      const enlaceTmdb = 'https://www.themoviedb.org/movie/1/watch';
      configurarFetch(detallePelicula, {
        region: 'AR',
        ofertas: [
          {
            tipoOferta: TIPO_OFERTA.SUSCRIPCION,
            plataformas: [
              {
                id: 1,
                tmdbProviderId: 8,
                nombre: 'Netflix',
                logoPath: '/netflix.jpg',
                urlHome: 'https://www.netflix.com',
              },
            ],
          },
          {
            tipoOferta: TIPO_OFERTA.CON_ANUNCIOS,
            plataformas: [
              {
                id: 3,
                tmdbProviderId: 337,
                nombre: 'Disney Plus',
                logoPath: '/disney.jpg',
                urlHome: 'https://www.disneyplus.com',
              },
            ],
          },
        ],
        enlaceTmdb,
      });

      renderDetalle();

      expect(
        await screen.findByRole('heading', { level: 3, name: 'Suscripción' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: 'Gratis con anuncios' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Ver disponibilidad en TMDB' })).toHaveAttribute(
        'href',
        enlaceTmdb,
      );
    });

    it('muestra un mensaje indicando que no está disponible cuando no hay plataformas en la región (Escenario 3)', async () => {
      configurarFetch(detallePelicula, respuestaDisponibilidad());

      renderDetalle();

      expect(
        await screen.findByText(
          'No encontramos disponibilidad en plataformas de streaming para tu región.',
        ),
      ).toBeInTheDocument();
    });

    it('muestra un mensaje de error y permite reintentar cuando falla la consulta de disponibilidad (Escenario 4)', async () => {
      let intento = 0;
      const fetchMock = vi.fn().mockImplementation((url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/disponibilidad')) {
          intento += 1;
          if (intento === 1) {
            return Promise.resolve({
              ok: false,
              json: async () => ({
                error: {
                  code: 'EXTERNAL_SERVICE',
                  message: 'No se pudo consultar la disponibilidad',
                },
              }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: {
                region: 'AR',
                ofertas: [
                  {
                    tipoOferta: TIPO_OFERTA.SUSCRIPCION,
                    plataformas: [
                      {
                        id: 1,
                        tmdbProviderId: 8,
                        nombre: 'Netflix',
                        logoPath: '/netflix.jpg',
                        urlHome: 'https://www.netflix.com',
                      },
                    ],
                  },
                ],
                enlaceTmdb: null,
              },
            }),
          });
        }
        if (urlStr.includes('/region')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: { region: 'AR', source: 'ip' } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: detallePelicula }),
        });
      });
      vi.stubGlobal('fetch', fetchMock);

      renderDetalle();

      expect(await screen.findByText('No se pudo consultar la disponibilidad')).toBeInTheDocument();
      const botonReintentar = screen.getByRole('button', { name: /Reintentar/i });

      fireEvent.click(botonReintentar);

      expect(await screen.findByText('Netflix')).toBeInTheDocument();
    });
  });

  describe('Plataformas propias en la disponibilidad', () => {
    const NETFLIX = {
      id: 1,
      tmdbProviderId: 8,
      nombre: 'Netflix',
      logoPath: '/netflix.jpg',
      urlHome: 'https://www.netflix.com',
    };
    const PRIME = {
      id: 2,
      tmdbProviderId: 119,
      nombre: 'Amazon Prime Video',
      logoPath: '/prime.jpg',
      urlHome: 'https://www.primevideo.com',
    };

    function configurarDisponibilidad() {
      configurarFetch(detallePelicula, respuestaDisponibilidad('AR', [NETFLIX, PRIME]));
    }

    it('sin sesión permite ir a todas las plataformas', async () => {
      configurarDisponibilidad();

      renderDetalle();

      expect(await screen.findByRole('link', { name: /Netflix/ })).toHaveAttribute(
        'href',
        NETFLIX.urlHome,
      );
      expect(screen.getByRole('link', { name: /Amazon Prime Video/ })).toHaveAttribute(
        'href',
        PRIME.urlHome,
      );
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('con sesión solo permite ir a las plataformas propias y avisa en las demás', async () => {
      configurarDisponibilidad();

      renderDetalle('/titulos/pelicula/1', undefined, {
        sesion: CON_SESION,
        propias: plataformasPropias([PRIME.id]),
      });

      expect(await screen.findByRole('link', { name: /Amazon Prime Video/ })).toHaveAttribute(
        'href',
        PRIME.urlHome,
      );
      expect(screen.queryByRole('link', { name: /Netflix/ })).not.toBeInTheDocument();
      expect(
        screen.getByRole('group', { name: 'Netflix (no está en tus plataformas)' }),
      ).toHaveAccessibleDescription('No tenés Netflix en tus plataformas');
    });

    it('con sesión muestra primero las plataformas propias', async () => {
      configurarDisponibilidad();

      renderDetalle('/titulos/pelicula/1', undefined, {
        sesion: CON_SESION,
        propias: plataformasPropias([PRIME.id]),
      });

      const lista = await screen.findByRole('list', {
        name: 'Plataformas disponibles: Suscripción',
      });
      const items = within(lista).getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('Amazon Prime Video');
      expect(items[1]).toHaveTextContent('Netflix');
    });

    it('mientras cargan las plataformas propias no oculta ninguna', async () => {
      configurarDisponibilidad();

      renderDetalle('/titulos/pelicula/1', undefined, {
        sesion: CON_SESION,
        propias: plataformasPropias([], { loading: true }),
      });

      expect(await screen.findByRole('link', { name: /Netflix/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Amazon Prime Video/ })).toBeInTheDocument();
    });
  });
});
