import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render as renderComponent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SessionContext } from '../../contexts/session/SessionContext.js';
import { PlataformasPropiasContext } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';
import { PaginaBusqueda } from './PaginaBusqueda.jsx';

const SIN_SESION = { user: null, loading: false };
const CON_SESION = { user: { id: 'u1', email: 'ana@mail.com' }, loading: false };

function plataformasPropias(ids = [], overrides = {}) {
  return { seleccionadas: new Set(ids), loading: false, error: '', ...overrides };
}

const respuestaConResultados = {
  data: {
    resultados: [
      {
        tmdbId: 1,
        tipo: 'pelicula',
        nombre: 'Dune',
        anio: 2021,
        posterUrl: null,
        puntuacion: 8.1,
      },
    ],
    pagina: 1,
    totalResultados: 1,
    totalPaginas: 1,
  },
};

function configurarFetch(respuesta = respuestaConResultados) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => respuesta,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function render(ui, { sesion = SIN_SESION, propias = plataformasPropias() } = {}) {
  return renderComponent(
    <SessionContext.Provider value={sesion}>
      <PlataformasPropiasContext.Provider value={propias}>
        <MemoryRouter>{ui}</MemoryRouter>
      </PlataformasPropiasContext.Provider>
    </SessionContext.Provider>,
  );
}

async function ejecutarBusqueda(nombre = 'Dune') {
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Dune' } });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  await screen.findByRole('heading', { level: 3, name: nombre });
}

beforeEach(() => {
  configurarFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PaginaBusqueda', () => {
  it('busca y muestra resultados con el contador', async () => {
    render(<PaginaBusqueda />);

    await ejecutarBusqueda();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Resultados para "Dune"' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 1 título')).toBeInTheDocument();
    const [url] = fetch.mock.calls[0];
    expect(url.toString()).toContain('/api/busqueda?q=Dune&pagina=1');
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Datos de títulos provistos por/)).not.toBeInTheDocument();
  });

  it('enlaza el resultado con el detalle usando tipo e identificador', async () => {
    render(<PaginaBusqueda />);

    await ejecutarBusqueda();

    expect(screen.getByRole('link', { name: 'Ver detalle de Dune' })).toHaveAttribute(
      'href',
      '/titulos/pelicula/1',
    );
  });

  it('no busca con un año incompleto cuando cambia el tipo', async () => {
    render(<PaginaBusqueda />);

    await ejecutarBusqueda();
    const campoAnio = screen.getByLabelText('Año');

    fireEvent.change(campoAnio, { target: { value: '202' } });
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'serie' } });

    expect(fetch).toHaveBeenCalledTimes(1);

    fireEvent.change(campoAnio, { target: { value: '2024' } });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const [url] = fetch.mock.calls[1];
    expect(url.toString()).toContain('q=Dune');
    expect(url.toString()).toContain('tipo=serie');
    expect(url.toString()).toContain('anio=2024');
  });

  it('filtra solo por tipo', async () => {
    render(<PaginaBusqueda />);

    await ejecutarBusqueda();
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'serie' } });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const [url] = fetch.mock.calls[1];
    expect(url.toString()).toContain('tipo=serie');
    expect(url.searchParams.has('anio')).toBe(false);
  });

  it('vuelve a buscar sin año al borrarlo', async () => {
    render(<PaginaBusqueda />);
    const campoAnio = screen.getByLabelText('Año');

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Dune' } });
    fireEvent.change(campoAnio, { target: { value: '2021' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('heading', { level: 3, name: 'Dune' });

    fireEvent.change(campoAnio, { target: { value: '' } });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const [url] = fetch.mock.calls[1];
    expect(url.searchParams.has('anio')).toBe(false);
  });

  it('no envía un año fuera de rango', async () => {
    render(<PaginaBusqueda />);

    await ejecutarBusqueda();
    fireEvent.change(screen.getByLabelText('Año'), { target: { value: '1800' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('usa el último título enviado al cambiar un filtro', async () => {
    render(<PaginaBusqueda />);

    await ejecutarBusqueda();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Matrix' } });
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'serie' } });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const [url] = fetch.mock.calls[1];
    expect(url.searchParams.get('q')).toBe('Dune');
  });

  it('carga la página siguiente y acumula resultados', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      const pagina = Number(new URL(url).searchParams.get('pagina'));
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: {
            resultados: [
              {
                tmdbId: pagina,
                tipo: 'pelicula',
                nombre: `Dune ${pagina}`,
                anio: 2021,
                posterUrl: null,
                puntuacion: 8.1,
              },
            ],
            pagina,
            totalResultados: 2,
            totalPaginas: 2,
          },
        }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<PaginaBusqueda />);

    await ejecutarBusqueda('Dune 1');
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));

    await screen.findByRole('heading', { level: 3, name: 'Dune 2' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('pagina')).toBe('2');
    expect(screen.getByText('Mostrando 2 de 2 títulos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument();
  });

  it('conserva los resultados si falla al cargar más', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            resultados: respuestaConResultados.data.resultados,
            pagina: 1,
            totalResultados: 2,
            totalPaginas: 2,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { code: 'EXTERNAL_SERVICE', message: 'No se pudo consultar TMDB' },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);
    render(<PaginaBusqueda />);

    await ejecutarBusqueda();
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo consultar TMDB');
    expect(screen.getByRole('heading', { level: 3, name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 de 2 títulos')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay resultados', async () => {
    configurarFetch({
      data: { resultados: [], pagina: 1, totalResultados: 0, totalPaginas: 0 },
    });
    render(<PaginaBusqueda />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Inexistente' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(
      await screen.findByText('No encontramos contenido disponible con esos filtros.'),
    ).toBeInTheDocument();
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
    render(<PaginaBusqueda />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Dune' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo consultar TMDB');
  });
});

const NETFLIX = { id: 1, tmdbProviderId: 8, nombre: 'Netflix', logoPath: null };

function respuestaFiltrada({ resultados, pagina = 1, totalPaginas = 1, ...resto }) {
  return {
    data: {
      resultados,
      pagina,
      totalPaginas,
      totalResultados: 20000,
      verificacionIncompleta: false,
      ...resto,
    },
  };
}

function duneEn(plataformas = [NETFLIX], tmdbId = 1) {
  return { ...respuestaConResultados.data.resultados[0], tmdbId, plataformas };
}

function rutaPedida(indice) {
  return new URL(fetch.mock.calls[indice][0]).pathname;
}

function renderConPlataformas(ids = [1]) {
  return render(<PaginaBusqueda />, { sesion: CON_SESION, propias: plataformasPropias(ids) });
}

async function activarFiltroYBuscar() {
  fireEvent.click(screen.getByRole('switch', { name: 'Solo mis plataformas' }));
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Dune' } });
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
}

describe('PaginaBusqueda: filtro de plataformas propias', () => {
  it('no muestra el filtro sin sesión', () => {
    render(<PaginaBusqueda />);

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('sin plataformas propias deshabilita el filtro y ofrece elegirlas', () => {
    renderConPlataformas([]);

    expect(screen.getByRole('switch', { name: 'Solo mis plataformas' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Elegí tus plataformas' })).toHaveAttribute(
      'href',
      '/mis-plataformas',
    );
  });

  it('deshabilita el filtro mientras cargan las plataformas propias', () => {
    render(<PaginaBusqueda />, {
      sesion: CON_SESION,
      propias: plataformasPropias([], { loading: true }),
    });

    expect(screen.getByRole('switch', { name: 'Solo mis plataformas' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('con el filtro activo busca solo en las plataformas propias y muestra sus logos', async () => {
    configurarFetch(respuestaFiltrada({ resultados: [duneEn()] }));
    renderConPlataformas();

    await activarFiltroYBuscar();

    expect(
      await screen.findByRole('link', { name: 'Ver detalle de Dune, disponible en Netflix' }),
    ).toBeInTheDocument();
    expect(rutaPedida(0)).toBe('/api/busqueda/propias');
    expect(screen.getByText('Resultados encontrados para tus plataformas')).toBeInTheDocument();
  });

  it('al activar el filtro después de buscar, repite la búsqueda filtrada', async () => {
    renderConPlataformas();
    await ejecutarBusqueda();
    configurarFetch(respuestaFiltrada({ resultados: [duneEn()] }));

    fireEvent.click(screen.getByRole('switch', { name: 'Solo mis plataformas' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(rutaPedida(0)).toBe('/api/busqueda/propias');
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get('q')).toBe('Dune');
  });

  it('"Cargar más" sigue pidiendo solo las plataformas propias', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      const pagina = Number(new URL(url).searchParams.get('pagina'));
      return Promise.resolve({
        ok: true,
        json: async () =>
          respuestaFiltrada({
            resultados: [{ ...duneEn([NETFLIX], pagina), nombre: `Dune ${pagina}` }],
            pagina,
            totalPaginas: 3,
          }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    renderConPlataformas();

    await activarFiltroYBuscar();
    await screen.findByRole('heading', { level: 3, name: 'Dune 1' });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));

    await screen.findByRole('heading', { level: 3, name: 'Dune 2' });
    expect(rutaPedida(1)).toBe('/api/busqueda/propias');
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('pagina')).toBe('2');
  });

  it('avisa si no se pudieron verificar algunos títulos', async () => {
    configurarFetch(respuestaFiltrada({ resultados: [duneEn()], verificacionIncompleta: true }));
    renderConPlataformas();

    await activarFiltroYBuscar();

    expect(
      await screen.findByText('No pudimos verificar algunos títulos, puede que falten resultados.'),
    ).toBeInTheDocument();
  });

  it('sin resultados en las plataformas propias lo informa y permite ver todos', async () => {
    configurarFetch(respuestaFiltrada({ resultados: [] }));
    renderConPlataformas();

    await activarFiltroYBuscar();

    expect(
      await screen.findByText(
        'Ninguno de los títulos encontrados está disponible en tus plataformas.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Seguir buscando' })).not.toBeInTheDocument();

    configurarFetch();
    fireEvent.click(screen.getByRole('button', { name: 'Ver todos los resultados' }));

    await screen.findByRole('heading', { level: 3, name: 'Dune' });
    expect(rutaPedida(0)).toBe('/api/busqueda');
    expect(screen.getByRole('switch', { name: 'Solo mis plataformas' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('sin resultados ofrece seguir buscando si quedan páginas', async () => {
    configurarFetch(respuestaFiltrada({ resultados: [], pagina: 2, totalPaginas: 5 }));
    renderConPlataformas();

    await activarFiltroYBuscar();

    fireEvent.click(await screen.findByRole('button', { name: 'Seguir buscando' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(rutaPedida(1)).toBe('/api/busqueda/propias');
    expect(new URL(fetch.mock.calls[1][0]).searchParams.get('pagina')).toBe('3');
  });

  it('si falla el filtrado informa el error y permite reintentar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { code: 'EXTERNAL_SERVICE', message: 'No se pudo consultar TMDB' },
        }),
      }),
    );
    renderConPlataformas();

    await activarFiltroYBuscar();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ocurrió un error al filtrar por tus plataformas. Probá de nuevo más tarde.',
    );

    configurarFetch(respuestaFiltrada({ resultados: [duneEn()] }));
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await screen.findByRole('heading', { level: 3, name: 'Dune' });
    expect(rutaPedida(0)).toBe('/api/busqueda/propias');
  });

  it('si la sesión venció lo informa', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { code: 'UNAUTHENTICATED', message: 'Tenés que iniciar sesión' },
        }),
      }),
    );
    renderConPlataformas();

    await activarFiltroYBuscar();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu sesión venció. Iniciá sesión de nuevo.',
    );
  });

  it('anuncia la carga mientras busca en las plataformas propias', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    renderConPlataformas();

    await activarFiltroYBuscar();

    expect(screen.getByRole('status')).toHaveTextContent('Buscando en tus plataformas...');
  });

  it('al cerrar sesión apaga el filtro y vuelve a buscar sin filtrar', async () => {
    configurarFetch(respuestaFiltrada({ resultados: [duneEn()] }));
    const { rerender } = renderConPlataformas();
    await activarFiltroYBuscar();
    await screen.findByRole('heading', { level: 3, name: 'Dune' });
    configurarFetch();

    rerender(
      <SessionContext.Provider value={SIN_SESION}>
        <PlataformasPropiasContext.Provider value={plataformasPropias()}>
          <MemoryRouter>
            <PaginaBusqueda />
          </MemoryRouter>
        </PlataformasPropiasContext.Provider>
      </SessionContext.Provider>,
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(rutaPedida(0)).toBe('/api/busqueda');
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
