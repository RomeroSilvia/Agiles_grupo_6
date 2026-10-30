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
    if (urlStr.includes('/api/watchlist/')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: { agregado: false } }),
      });
    }
    if (urlStr.includes('/disponibilidad/alternativas')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: {
            region: regionDetectada.region,
            disponibleEnRegionActual: false,
            alternativas: [],
          },
        }),
      });
    }
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

function respuestaHttp(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

function configurarFetchWatchlist({ fallarAlta = false } = {}) {
  let agregado = false;
  const fetchMock = vi.fn((input, options = {}) => {
    const url = new URL(input.toString());
    const method = options.method ?? 'GET';

    if (url.pathname === '/api/watchlist/pelicula/1') {
      if (method === 'GET') {
        return Promise.resolve(respuestaHttp({ data: { agregado } }));
      }
      if (method === 'PUT') {
        agregado = true;
        if (fallarAlta) {
          return Promise.resolve(
            respuestaHttp(
              { error: { code: 'DATABASE', message: 'No se pudo agregar el título' } },
              500,
            ),
          );
        }
        return Promise.resolve(respuestaHttp(null, 204));
      }
      if (method === 'DELETE') {
        agregado = false;
        return Promise.resolve(respuestaHttp(null, 204));
      }
    }

    if (url.pathname === '/api/region') {
      return Promise.resolve(respuestaHttp({ data: { region: 'AR', source: 'ip' } }));
    }
    if (url.pathname === '/api/titulos/pelicula/1/disponibilidad/alternativas') {
      return Promise.resolve(
        respuestaHttp({
          data: { region: 'AR', disponibleEnRegionActual: false, alternativas: [] },
        }),
      );
    }
    if (url.pathname === '/api/titulos/pelicula/1/disponibilidad') {
      return Promise.resolve(respuestaHttp({ data: respuestaDisponibilidad() }));
    }
    if (url.pathname === '/api/titulos/pelicula/1') {
      return Promise.resolve(respuestaHttp({ data: detallePelicula }));
    }

    throw new Error(`Solicitud inesperada: ${method} ${url.pathname}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PaginaDetalleTitulo', () => {
  it('agrega y quita el título de la watchlist desde el detalle', async () => {
    const fetchMock = configurarFetchWatchlist();

    renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

    fireEvent.click(await screen.findByRole('button', { name: 'Agregar a mi watchlist' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Quitar de mi watchlist' }));

    expect(
      await screen.findByRole('button', { name: 'Agregar a mi watchlist' }),
    ).toBeInTheDocument();
    const solicitudesWatchlist = fetchMock.mock.calls
      .filter(([input]) => new URL(input.toString()).pathname === '/api/watchlist/pelicula/1')
      .map(([, options]) => options.method ?? 'GET');
    expect(solicitudesWatchlist).toEqual(['GET', 'PUT', 'DELETE']);
  });

  it('muestra el estado persistido si falla el alta pero la API confirma que se guardó', async () => {
    const fetchMock = configurarFetchWatchlist({ fallarAlta: true });

    renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });
    fireEvent.click(await screen.findByRole('button', { name: 'Agregar a mi watchlist' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo agregar el título');
    expect(screen.getByRole('alert')).toHaveTextContent('Estado guardado: está en tu watchlist.');
    expect(screen.getByRole('button', { name: 'Quitar de mi watchlist' })).toBeInTheDocument();
    const solicitudesDeEstado = fetchMock.mock.calls.filter(
      ([input, options]) =>
        new URL(input.toString()).pathname === '/api/watchlist/pelicula/1' &&
        (options.method ?? 'GET') === 'GET',
    );
    expect(solicitudesDeEstado).toHaveLength(2);
  });

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

  it('muestra la página de no encontrado cuando la API devuelve NOT_FOUND', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        const urlStr = url.toString();
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
        return Promise.resolve({
          ok: false,
          json: async () => ({
            error: { code: 'NOT_FOUND', message: 'No se encontró el título solicitado' },
          }),
        });
      }),
    );

    renderDetalle('/titulos/pelicula/999');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Página no encontrada' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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

    it('abre la ficha del título en la plataforma elegida cuando hay deep link', async () => {
      configurarFetch(
        detallePelicula,
        respuestaDisponibilidad('AR', [
          {
            id: 1,
            tmdbProviderId: 8,
            nombre: 'Netflix',
            logoPath: '/netflix.jpg',
            urlHome: 'https://www.netflix.com',
            deepLink: 'https://www.netflix.com/title/1',
          },
          {
            id: 2,
            tmdbProviderId: 119,
            nombre: 'Amazon Prime Video',
            logoPath: '/prime.jpg',
            urlHome: 'https://www.primevideo.com',
            deepLink: 'https://www.primevideo.com/detail/1',
          },
        ]),
      );

      renderDetalle();

      const netflix = await screen.findByRole('link', { name: 'Ver Dune en Netflix' });
      expect(netflix).toHaveAttribute('href', 'https://www.netflix.com/title/1');
      expect(netflix).toHaveAttribute('target', '_blank');
      expect(netflix).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.getByRole('link', { name: 'Ver Dune en Amazon Prime Video' })).toHaveAttribute(
        'href',
        'https://www.primevideo.com/detail/1',
      );
      expect(screen.getByRole('link', { name: 'JustWatch' })).toBeInTheDocument();
    });

    it('no muestra un nombre de respaldo en el enlace cuando el título no tiene nombre', async () => {
      configurarFetch(
        { ...detallePelicula, nombre: null },
        respuestaDisponibilidad('AR', [
          {
            id: 1,
            tmdbProviderId: 8,
            nombre: 'Netflix',
            logoPath: '/netflix.jpg',
            urlHome: 'https://www.netflix.com',
            deepLink: 'https://www.netflix.com/title/1',
          },
        ]),
      );

      renderDetalle();

      expect(await screen.findByRole('link', { name: 'Ir a Netflix' })).toHaveAttribute(
        'href',
        'https://www.netflix.com/title/1',
      );
    });

    it('usa la home de la plataforma cuando el deep link falta o no es válido', async () => {
      configurarFetch(
        detallePelicula,
        respuestaDisponibilidad('AR', [
          {
            id: 1,
            tmdbProviderId: 8,
            nombre: 'Netflix',
            logoPath: '/netflix.jpg',
            urlHome: 'https://www.netflix.com',
            deepLink: null,
          },
          {
            id: 2,
            tmdbProviderId: 119,
            nombre: 'Amazon Prime Video',
            logoPath: '/prime.jpg',
            urlHome: 'https://www.primevideo.com',
            deepLink: 'javascript:alert(1)',
          },
        ]),
      );

      renderDetalle();

      expect(await screen.findByRole('link', { name: 'Ir a Netflix' })).toHaveAttribute(
        'href',
        'https://www.netflix.com',
      );
      expect(screen.getByRole('link', { name: 'Ir a Amazon Prime Video' })).toHaveAttribute(
        'href',
        'https://www.primevideo.com',
      );
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

  describe('Atribución a fuente de datos (E6HU3)', () => {
    it('muestra de forma visible la atribución a JustWatch junto a la disponibilidad', async () => {
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

      expect(await screen.findByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText(/Datos de disponibilidad provistos por/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'JustWatch' })).toHaveAttribute(
        'href',
        'https://www.justwatch.com',
      );
    });
  });

  describe('Comparación de disponibilidad entre regiones (E2HU2)', () => {
    it('solicita iniciar sesión cuando la persona no está autenticada', async () => {
      configurarFetch();

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: SIN_SESION });

      expect(
        await screen.findByText(/Iniciá sesión para comparar la disponibilidad en otras regiones/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Iniciar sesión para comparar regiones' }),
      ).toHaveAttribute('href', '/iniciar-sesion');
    });

    it('muestra las regiones y plataformas cuando el título está disponible en otra región (Escenario 1)', async () => {
      const fetchMock = vi.fn((url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/api/watchlist/')) {
          return Promise.resolve(respuestaHttp({ data: { agregado: false } }));
        }
        if (urlStr.includes('/disponibilidad/comparacion')) {
          return Promise.resolve(
            respuestaHttp({
              data: {
                regiones: [
                  {
                    region: 'US',
                    enlaceTmdb: null,
                    ofertas: [
                      {
                        tipoOferta: TIPO_OFERTA.SUSCRIPCION,
                        plataformas: [
                          {
                            id: 3,
                            tmdbProviderId: 337,
                            nombre: 'Disney Plus',
                            logoPath: '/disney.jpg',
                            urlHome: 'https://www.disneyplus.com',
                            deepLink: null,
                          },
                        ],
                      },
                    ],
                  },
                ],
                regionesFallidas: [],
              },
            }),
          );
        }
        if (urlStr.includes('/disponibilidad')) {
          return Promise.resolve(respuestaHttp({ data: respuestaDisponibilidad('AR') }));
        }
        if (urlStr.includes('/region')) {
          return Promise.resolve(respuestaHttp({ data: { region: 'AR', source: 'profile' } }));
        }
        return Promise.resolve(respuestaHttp({ data: detallePelicula }));
      });
      vi.stubGlobal('fetch', fetchMock);

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

      const botonUs = await screen.findByRole('button', { name: /Estados Unidos \(US\)/i });
      fireEvent.click(botonUs);
      fireEvent.click(screen.getByRole('button', { name: 'Comparar disponibilidad' }));

      const resultados = await screen.findByLabelText('Resultados de comparación por región');
      expect(within(resultados).getByText('Estados Unidos (US)')).toBeInTheDocument();
      expect(within(resultados).getByText('Disney Plus')).toBeInTheDocument();
    });

    it('informa cuando no se encontró disponibilidad en las regiones comparadas (Escenario 2)', async () => {
      const fetchMock = vi.fn((url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/api/watchlist/')) {
          return Promise.resolve(respuestaHttp({ data: { agregado: false } }));
        }
        if (urlStr.includes('/disponibilidad/comparacion')) {
          return Promise.resolve(
            respuestaHttp({
              data: {
                regiones: [
                  { region: 'ES', ofertas: [], enlaceTmdb: null },
                  { region: 'MX', ofertas: [], enlaceTmdb: null },
                ],
                regionesFallidas: [],
              },
            }),
          );
        }
        if (urlStr.includes('/disponibilidad')) {
          return Promise.resolve(respuestaHttp({ data: respuestaDisponibilidad('AR') }));
        }
        if (urlStr.includes('/region')) {
          return Promise.resolve(respuestaHttp({ data: { region: 'AR', source: 'profile' } }));
        }
        return Promise.resolve(respuestaHttp({ data: detallePelicula }));
      });
      vi.stubGlobal('fetch', fetchMock);

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

      fireEvent.click(await screen.findByRole('button', { name: /España \(ES\)/i }));
      fireEvent.click(screen.getByRole('button', { name: /México \(MX\)/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Comparar disponibilidad' }));

      expect(
        await screen.findByText(
          /No se encontró disponibilidad para este título en las regiones consultadas \(España \(ES\), México \(MX\)\)\./i,
        ),
      ).toBeInTheDocument();
    });

    it('muestra resultados confirmados e identifica la región fallida ante un fallo parcial (Escenario 5)', async () => {
      const fetchMock = vi.fn((url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/api/watchlist/')) {
          return Promise.resolve(respuestaHttp({ data: { agregado: false } }));
        }
        if (urlStr.includes('/disponibilidad/comparacion')) {
          return Promise.resolve(
            respuestaHttp({
              data: {
                regiones: [
                  {
                    region: 'US',
                    enlaceTmdb: null,
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
                            deepLink: null,
                          },
                        ],
                      },
                    ],
                  },
                ],
                regionesFallidas: ['BR'],
              },
            }),
          );
        }
        if (urlStr.includes('/disponibilidad')) {
          return Promise.resolve(respuestaHttp({ data: respuestaDisponibilidad('AR') }));
        }
        if (urlStr.includes('/region')) {
          return Promise.resolve(respuestaHttp({ data: { region: 'AR', source: 'profile' } }));
        }
        return Promise.resolve(respuestaHttp({ data: detallePelicula }));
      });
      vi.stubGlobal('fetch', fetchMock);

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

      fireEvent.click(await screen.findByRole('button', { name: /Estados Unidos \(US\)/i }));
      fireEvent.click(screen.getByRole('button', { name: /Brasil \(BR\)/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Comparar disponibilidad' }));

      expect(
        await screen.findByText(/No se pudo obtener la disponibilidad para: Brasil \(BR\)\./i),
      ).toBeInTheDocument();
      const resultados = screen.getByLabelText('Resultados de comparación por región');
      expect(within(resultados).getByText('Netflix')).toBeInTheDocument();
    });

    it('abre el acordeón de comparación al presionar su botón', async () => {
      configurarFetch();

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

      const botonAcordeon = await screen.findByRole('button', {
        name: /Comparar disponibilidad en otras regiones/i,
      });
      expect(botonAcordeon).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(botonAcordeon);
      expect(botonAcordeon).toHaveAttribute('aria-expanded', 'true');
    });

    it('deshabilita las demás regiones al seleccionar el máximo de 5 regiones', async () => {
      configurarFetch();

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

      const regionesASeleccionar = [
        /Brasil \(BR\)/i,
        /Chile \(CL\)/i,
        /Colombia \(CO\)/i,
        /México \(MX\)/i,
        /Estados Unidos \(US\)/i,
      ];

      for (const patron of regionesASeleccionar) {
        fireEvent.click(await screen.findByRole('button', { name: patron }));
      }

      expect(screen.getByRole('button', { name: /España \(ES\)/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Estados Unidos \(US\)/i })).toBeEnabled();
    });

    it('muestra el error total (502) y permite reintentar la comparación', async () => {
      let intento = 0;
      const fetchMock = vi.fn((url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/api/watchlist/')) {
          return Promise.resolve(respuestaHttp({ data: { agregado: false } }));
        }
        if (urlStr.includes('/disponibilidad/comparacion')) {
          intento += 1;
          if (intento === 1) {
            return Promise.resolve(
              respuestaHttp(
                {
                  error: {
                    code: 'EXTERNAL_SERVICE',
                    message: 'No se pudo consultar TMDB',
                  },
                },
                502,
              ),
            );
          }
          return Promise.resolve(
            respuestaHttp({
              data: {
                regiones: [{ region: 'US', ofertas: [], enlaceTmdb: null }],
                regionesFallidas: [],
              },
            }),
          );
        }
        if (urlStr.includes('/disponibilidad')) {
          return Promise.resolve(respuestaHttp({ data: respuestaDisponibilidad('AR') }));
        }
        if (urlStr.includes('/region')) {
          return Promise.resolve(respuestaHttp({ data: { region: 'AR', source: 'profile' } }));
        }
        return Promise.resolve(respuestaHttp({ data: detallePelicula }));
      });
      vi.stubGlobal('fetch', fetchMock);

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

      fireEvent.click(await screen.findByRole('button', { name: /Estados Unidos \(US\)/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Comparar disponibilidad' }));

      expect(await screen.findByText('No se pudo consultar TMDB')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

      expect(
        await screen.findByText(
          /No se encontró disponibilidad para este título en las regiones consultadas \(Estados Unidos \(US\)\)\./i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Sugerencia de regiones alternativas (E2HU3)', () => {
    it('sugiere regiones alternativas e informa sobre VPN sin ofrecer un servicio de VPN cuando no está en la región actual (Escenarios 1, 2 y 3)', async () => {
      const fetchMock = vi.fn((url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/api/watchlist/')) {
          return Promise.resolve(respuestaHttp({ data: { agregado: false } }));
        }
        if (urlStr.includes('/disponibilidad/alternativas')) {
          return Promise.resolve(
            respuestaHttp({
              data: {
                region: 'AR',
                disponibleEnRegionActual: false,
                alternativas: [
                  {
                    region: 'US',
                    enlaceTmdb: null,
                    ofertas: [
                      {
                        tipoOferta: TIPO_OFERTA.SUSCRIPCION,
                        plataformas: [
                          {
                            id: 3,
                            tmdbProviderId: 337,
                            nombre: 'Disney Plus',
                            logoPath: '/disney.jpg',
                            urlHome: 'https://www.disneyplus.com',
                            deepLink: null,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            }),
          );
        }
        if (urlStr.includes('/disponibilidad')) {
          return Promise.resolve(respuestaHttp({ data: respuestaDisponibilidad('AR') }));
        }
        if (urlStr.includes('/region')) {
          return Promise.resolve(respuestaHttp({ data: { region: 'AR', source: 'profile' } }));
        }
        return Promise.resolve(respuestaHttp({ data: detallePelicula }));
      });
      vi.stubGlobal('fetch', fetchMock);

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

      const seccionSugerencia = await screen.findByRole('region', {
        name: 'Regiones alternativas disponibles',
      });
      expect(within(seccionSugerencia).getByText('Disney Plus')).toBeInTheDocument();
      expect(
        within(seccionSugerencia).getByText(
          /Podés decidir por tu cuenta si acceder a este título utilizando una VPN/i,
        ),
      ).toBeInTheDocument();
      expect(
        within(seccionSugerencia).getByText(
          /brinda únicamente información de disponibilidad y no ofrece directamente un servicio de VPN/i,
        ),
      ).toBeInTheDocument();
      expect(
        within(seccionSugerencia).queryByRole('link', { name: /vpn/i }),
      ).not.toBeInTheDocument();
    });

    it('no muestra sugerencia cuando no hay disponibilidad fuera de la región actual (Escenario 2 de #10)', async () => {
      configurarFetch(detallePelicula, respuestaDisponibilidad('AR'));

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

      expect(
        await screen.findByText(
          'No encontramos disponibilidad en plataformas de streaming para tu región.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('region', { name: 'Regiones alternativas disponibles' }),
      ).not.toBeInTheDocument();
    });

    it('no muestra sugerencia de región alternativa cuando el título sí está disponible en la región actual (Escenario 3 de #10)', async () => {
      const fetchMock = configurarFetch(
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

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

      expect(await screen.findByText('Netflix')).toBeInTheDocument();
      expect(
        screen.queryByRole('region', { name: 'Regiones alternativas disponibles' }),
      ).not.toBeInTheDocument();
      expect(fetchMock.mock.calls.some(([url]) => url.toString().includes('/alternativas'))).toBe(
        false,
      );
    });

    it('informa el error recuperable sin mostrar regiones no confirmadas cuando falla la consulta de alternativas (Escenario 6 de #10)', async () => {
      const fetchMock = vi.fn((url) => {
        const urlStr = url.toString();
        if (urlStr.includes('/api/watchlist/')) {
          return Promise.resolve(respuestaHttp({ data: { agregado: false } }));
        }
        if (urlStr.includes('/disponibilidad/alternativas')) {
          return Promise.resolve(
            respuestaHttp(
              {
                error: {
                  code: 'EXTERNAL_SERVICE',
                  message: 'No se pudo consultar regiones alternativas',
                },
              },
              502,
            ),
          );
        }
        if (urlStr.includes('/disponibilidad')) {
          return Promise.resolve(respuestaHttp({ data: respuestaDisponibilidad('AR') }));
        }
        if (urlStr.includes('/region')) {
          return Promise.resolve(respuestaHttp({ data: { region: 'AR', source: 'profile' } }));
        }
        return Promise.resolve(respuestaHttp({ data: detallePelicula }));
      });
      vi.stubGlobal('fetch', fetchMock);

      renderDetalle('/titulos/pelicula/1', undefined, { sesion: CON_SESION });

      expect(
        await screen.findByText('No se pudo consultar regiones alternativas'),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('region', { name: 'Regiones alternativas disponibles' }),
      ).not.toBeInTheDocument();
    });
  });
});
