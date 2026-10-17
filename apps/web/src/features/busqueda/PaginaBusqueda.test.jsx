import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fireEvent,
  render as renderComponent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { SessionContext } from '../../contexts/session/SessionContext.js';
import { PlataformasPropiasContext } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';
import { PaginaBusqueda } from './PaginaBusqueda.jsx';
import { VolverBusqueda } from '../detalle/VolverBusqueda.jsx';
import { MAX_PAGINAS_RESTAURABLES } from './busqueda.constants.js';

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

function render(
  ui,
  { sesion = SIN_SESION, propias = plataformasPropias(), initialEntries = ['/'] } = {},
) {
  return renderComponent(
    <SessionContext.Provider value={sesion}>
      <PlataformasPropiasContext.Provider value={propias}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </PlataformasPropiasContext.Provider>
    </SessionContext.Provider>,
  );
}

function UbicacionActual() {
  const location = useLocation();
  return <output data-testid="parametros-url">{location.search}</output>;
}

function PaginaDetallePrueba() {
  return (
    <section>
      <h1>Detalle</h1>
      <VolverBusqueda />
    </section>
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

  it('restaura en orden las páginas guardadas en los parámetros de la URL', async () => {
    const fetchMock = vi.fn(async (input) => {
      const url = new URL(input.toString());
      const pagina = Number(url.searchParams.get('pagina'));
      return {
        ok: true,
        json: async () => ({
          data: {
            resultados: [
              {
                ...respuestaConResultados.data.resultados[0],
                tmdbId: pagina,
                nombre: `Dune ${pagina}`,
              },
            ],
            pagina,
            totalResultados: 2,
            totalPaginas: 2,
          },
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PaginaBusqueda />, {
      initialEntries: ['/?q=Dune&tipo=pelicula&anio=2021&pagina=2'],
    });

    expect(await screen.findByRole('heading', { level: 3, name: 'Dune 2' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Dune 1' })).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('Dune');
    expect(screen.getByLabelText('Tipo')).toHaveValue('pelicula');
    expect(screen.getByLabelText('Año')).toHaveValue(2021);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const paginasSolicitadas = fetchMock.mock.calls.map(([url]) =>
      new URL(url.toString()).searchParams.get('pagina'),
    );
    expect(paginasSolicitadas).toEqual(['1', '2']);
    expect(new URL(fetchMock.mock.calls[0][0].toString()).searchParams.get('q')).toBe('Dune');
    expect(new URL(fetchMock.mock.calls[0][0].toString()).searchParams.get('tipo')).toBe(
      'pelicula',
    );
    expect(new URL(fetchMock.mock.calls[0][0].toString()).searchParams.get('anio')).toBe('2021');
  });

  it('resuelve el nombre de la persona por ID y no conserva nombres editables en la URL', async () => {
    const fetchMock = configurarFetchConOpciones();
    render(
      <>
        <PaginaBusqueda />
        <UbicacionActual />
      </>,
      { initialEntries: ['/?q=Dune&actor=6193&actorNombre=Nombre%20falso&pagina=1'] },
    );

    expect(await screen.findByText('Leonardo DiCaprio')).toBeInTheDocument();
    await waitFor(() => {
      const params = new URLSearchParams(screen.getByTestId('parametros-url').textContent);
      expect(params.get('actor')).toBe('6193');
      expect(params.has('actorNombre')).toBe(false);
      expect(params.has('directorNombre')).toBe(false);
    });
    expect(
      fetchMock.mock.calls.some(
        ([input]) => new URL(input.toString()).pathname === '/api/busqueda/personas/6193',
      ),
    ).toBe(true);
  });

  it('limita las páginas restauradas aunque la URL solicite más', async () => {
    const fetchMock = vi.fn(async (input) => {
      const pagina = Number(new URL(input.toString()).searchParams.get('pagina'));
      return {
        ok: true,
        json: async () => ({
          data: {
            resultados: [
              {
                ...respuestaConResultados.data.resultados[0],
                tmdbId: pagina,
                nombre: `Dune ${pagina}`,
              },
            ],
            pagina,
            totalResultados: 500,
            totalPaginas: 500,
          },
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PaginaBusqueda />, { initialEntries: ['/?q=Dune&pagina=500'] });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(MAX_PAGINAS_RESTAURABLES));
    expect(
      fetchMock.mock.calls.map(([url]) => new URL(url.toString()).searchParams.get('pagina')),
    ).toEqual(Array.from({ length: MAX_PAGINAS_RESTAURABLES }, (_, indice) => String(indice + 1)));
  });

  it('conserva los resultados cargados al ir al detalle y volver', async () => {
    const fetchMock = vi.fn(async (input) => {
      const pagina = Number(new URL(input.toString()).searchParams.get('pagina'));
      return {
        ok: true,
        json: async () => ({
          data: {
            resultados: [
              {
                ...respuestaConResultados.data.resultados[0],
                tmdbId: pagina,
                nombre: `Dune ${pagina}`,
              },
            ],
            pagina,
            totalResultados: 3,
            totalPaginas: 3,
          },
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <Routes>
        <Route
          path="/"
          element={
            <>
              <PaginaBusqueda />
              <UbicacionActual />
            </>
          }
        />
        <Route path="/titulos/:tipo/:tmdbId" element={<PaginaDetallePrueba />} />
      </Routes>,
    );

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Dune' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('heading', { level: 3, name: 'Dune 1' })).toBeInTheDocument();

    for (const pagina of [2, 3]) {
      fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));
      expect(
        await screen.findByRole('heading', { level: 3, name: `Dune ${pagina}` }),
      ).toBeInTheDocument();
    }

    await waitFor(() => expect(screen.getByTestId('parametros-url')).toHaveTextContent('pagina=3'));
    fireEvent.click(screen.getByRole('link', { name: 'Ver detalle de Dune 1' }));
    expect(await screen.findByRole('heading', { name: 'Detalle' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Volver a la búsqueda' }));

    expect(await screen.findByRole('heading', { level: 3, name: 'Dune 3' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Dune 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Dune 2' })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(6));
    expect(
      fetchMock.mock.calls.map(([url]) => new URL(url.toString()).searchParams.get('pagina')),
    ).toEqual(['1', '2', '3', '1', '2', '3']);
  });

  it('actualiza los parámetros al buscar y al cargar más resultados', async () => {
    const fetchMock = vi.fn().mockImplementation((input) => {
      const pagina = Number(new URL(input.toString()).searchParams.get('pagina'));
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: {
            resultados: [
              {
                ...respuestaConResultados.data.resultados[0],
                tmdbId: pagina,
                nombre: `Dune ${pagina}`,
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

    render(
      <>
        <PaginaBusqueda />
        <UbicacionActual />
      </>,
    );

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Dune' } });
    expect(screen.getByTestId('parametros-url')).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('heading', { level: 3, name: 'Dune 1' });
    await waitFor(() =>
      expect(
        new URLSearchParams(screen.getByTestId('parametros-url').textContent).get('pagina'),
      ).toBe('1'),
    );
    expect(new URLSearchParams(screen.getByTestId('parametros-url').textContent).get('q')).toBe(
      'Dune',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));
    await screen.findByRole('heading', { level: 3, name: 'Dune 2' });
    await waitFor(() =>
      expect(
        new URLSearchParams(screen.getByTestId('parametros-url').textContent).get('pagina'),
      ).toBe('2'),
    );
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

function respuestaFiltrada({
  resultados,
  pagina = 1,
  totalPaginas = 1,
  verificacionIncompleta = false,
}) {
  return {
    data: {
      resultados,
      pagina,
      totalPaginas,
      totalResultados: 20000,
      verificacionIncompleta,
    },
  };
}

function duneEn(plataformas = [NETFLIX], tmdbId = 1) {
  return { ...respuestaConResultados.data.resultados[0], tmdbId, plataformas };
}

function configurarFetchConOpciones(respuestaBusqueda = respuestaConResultados) {
  const fetchMock = vi.fn(async (input) => {
    const url = new URL(input.toString());
    let data = respuestaBusqueda.data;

    if (url.pathname === '/api/busqueda/generos') {
      data = [{ id: 'drama', nombre: 'Drama' }];
    } else if (url.pathname === '/api/busqueda/personas') {
      data =
        url.searchParams.get('rol') === 'actor'
          ? [{ id: 6193, nombre: 'Leonardo DiCaprio', fotoUrl: null }]
          : [{ id: 525, nombre: 'Christopher Nolan', fotoUrl: null }];
    } else if (url.pathname.startsWith('/api/busqueda/personas/')) {
      data =
        url.searchParams.get('rol') === 'actor'
          ? { id: 6193, nombre: 'Leonardo DiCaprio', fotoUrl: null }
          : { id: 525, nombre: 'Christopher Nolan', fotoUrl: null };
    }

    return { ok: true, json: async () => ({ data }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
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

    const director = screen.getByRole('combobox', { name: 'Director' });
    const filtroPropias = screen.getByRole('switch', { name: 'Solo mis plataformas' });
    expect(screen.getByRole('switch', { name: 'Solo mis plataformas' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(
      director.compareDocumentPosition(filtroPropias) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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

  it('mientras sigue buscando mantiene el aviso y muestra que está buscando', async () => {
    configurarFetch(respuestaFiltrada({ resultados: [], pagina: 2, totalPaginas: 5 }));
    renderConPlataformas();

    await activarFiltroYBuscar();

    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Seguir buscando' }));

    const aviso = screen.getByText(
      'Ninguno de los títulos encontrados está disponible en tus plataformas.',
    ).parentElement;
    expect(await within(aviso).findByRole('button', { name: 'Buscando...' })).toBeDisabled();
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

  it('avisa si no se pudo verificar algún título y permite reintentar', async () => {
    configurarFetch(respuestaFiltrada({ resultados: [duneEn()], verificacionIncompleta: true }));
    renderConPlataformas();

    await activarFiltroYBuscar();

    expect(
      await screen.findByText(
        'No pudimos verificar todos los títulos. Puede haber más disponibles en tus plataformas.',
      ),
    ).toBeInTheDocument();

    configurarFetch(respuestaFiltrada({ resultados: [duneEn()] }));
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(rutaPedida(0)).toBe('/api/busqueda/propias');
    await waitFor(() =>
      expect(screen.queryByText(/No pudimos verificar todos los títulos/)).not.toBeInTheDocument(),
    );
  });

  it('sin resultados y con verificación incompleta no afirma que no hay disponibles', async () => {
    configurarFetch(respuestaFiltrada({ resultados: [], verificacionIncompleta: true }));
    renderConPlataformas();

    await activarFiltroYBuscar();

    expect(
      await screen.findByText(
        'No encontramos títulos en tus plataformas, pero no pudimos confirmar la disponibilidad de algunos.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Ninguno de los títulos encontrados está disponible en tus plataformas.'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  describe('al volver con el navegador', () => {
    function renderConBusquedaCompartida(idsActuales) {
      return renderComponent(
        <SessionContext.Provider value={CON_SESION}>
          <PlataformasPropiasContext.Provider value={plataformasPropias(idsActuales)}>
            <MemoryRouter initialEntries={['/?q=Dune&pagina=1&propias=true']}>
              <PaginaBusqueda />
            </MemoryRouter>
          </PlataformasPropiasContext.Provider>
        </SessionContext.Provider>,
      );
    }

    it('repite la búsqueda filtrada si cambiaron las plataformas propias', async () => {
      configurarFetch(respuestaFiltrada({ resultados: [] }));
      renderConBusquedaCompartida([3]);

      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      expect(rutaPedida(0)).toBe('/api/busqueda/propias');
      expect(new URL(fetch.mock.calls[0][0]).searchParams.get('q')).toBe('Dune');
      expect(
        await screen.findByText(
          'Ninguno de los títulos encontrados está disponible en tus plataformas.',
        ),
      ).toBeInTheDocument();
    });

    it('recupera la búsqueda filtrada y sus plataformas desde la URL', async () => {
      configurarFetch(respuestaFiltrada({ resultados: [duneEn()] }));
      renderConBusquedaCompartida([3, 1]);

      expect(
        await screen.findByRole('link', { name: 'Ver detalle de Dune, disponible en Netflix' }),
      ).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(1);
    });
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

describe('PaginaBusqueda: filtros de género, actor y director', () => {
  it('limpia los filtros avanzados y conserva la consulta, el tipo y el año', async () => {
    const fetchMock = configurarFetchConOpciones();
    render(
      <>
        <PaginaBusqueda />
        <UbicacionActual />
      </>,
    );

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Dune' } });
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'pelicula' } });
    fireEvent.change(screen.getByLabelText('Año'), { target: { value: '2021' } });
    fireEvent.focus(screen.getByLabelText('Género'));
    await screen.findByRole('option', { name: 'Drama' });
    fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'drama' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('heading', { level: 3, name: 'Dune' });

    await waitFor(() => {
      const solicitud = fetchMock.mock.calls
        .map(([input]) => new URL(input.toString()))
        .find((url) => url.pathname === '/api/busqueda' && url.searchParams.has('genero'));
      expect(solicitud?.searchParams.get('tipo')).toBe('pelicula');
      expect(solicitud?.searchParams.get('anio')).toBe('2021');
      expect(solicitud?.searchParams.get('genero')).toBe('drama');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Título')).toHaveValue('Dune');
      expect(screen.getByLabelText('Tipo')).toHaveValue('pelicula');
      expect(screen.getByLabelText('Año')).toHaveValue(2021);
      expect(screen.getByLabelText('Género')).toHaveValue('');
      expect(screen.getByRole('combobox', { name: 'Actor' })).toHaveValue('');
      expect(screen.getByRole('combobox', { name: 'Director' })).toHaveValue('');
      expect(screen.getByTestId('parametros-url').textContent).toContain(
        '?q=Dune&tipo=pelicula&anio=2021&pagina=1',
      );
      expect(screen.getByRole('heading', { level: 3, name: 'Dune' })).toBeInTheDocument();
    });

    const busquedas = fetchMock.mock.calls
      .map(([input]) => new URL(input.toString()))
      .filter((url) => url.pathname === '/api/busqueda');
    expect(busquedas).toHaveLength(2);
    expect(busquedas.at(-1).searchParams.get('q')).toBe('Dune');
    expect(busquedas.at(-1).searchParams.get('tipo')).toBe('pelicula');
    expect(busquedas.at(-1).searchParams.get('anio')).toBe('2021');
    expect(busquedas.at(-1).searchParams.has('genero')).toBe(false);
  });

  it('combina el filtro de plataformas propias con los filtros avanzados', async () => {
    const fetchMock = configurarFetchConOpciones();
    render(<PaginaBusqueda />, {
      sesion: CON_SESION,
      propias: plataformasPropias([1]),
      initialEntries: ['/?q=Dune&propias=true'],
    });

    await screen.findByRole('heading', { level: 3, name: 'Dune' });

    fireEvent.focus(screen.getByLabelText('Género'));
    await screen.findByRole('option', { name: 'Drama' });
    fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'drama' } });

    const filtroPropias = screen.getByRole('switch', { name: 'Solo mis plataformas' });
    expect(filtroPropias).toHaveAttribute('aria-disabled', 'false');
    expect(filtroPropias).toHaveAttribute('aria-checked', 'true');

    await waitFor(() => {
      const solicitudes = fetchMock.mock.calls
        .map(([input]) => new URL(input.toString()))
        .filter((url) => ['/api/busqueda', '/api/busqueda/propias'].includes(url.pathname));
      expect(solicitudes.at(-1).pathname).toBe('/api/busqueda/propias');
      expect(solicitudes.at(-1).searchParams.get('genero')).toBe('drama');
    });
  });

  it('permite buscar por género sin completar el título', async () => {
    const fetchMock = configurarFetchConOpciones();
    render(
      <>
        <PaginaBusqueda />
        <UbicacionActual />
      </>,
    );

    const titulo = screen.getByLabelText('Título');
    expect(titulo).toBeRequired();

    fireEvent.focus(screen.getByLabelText('Género'));
    await screen.findByRole('option', { name: 'Drama' });
    fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'drama' } });

    expect(titulo).not.toBeRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      const solicitud = fetchMock.mock.calls
        .map(([input]) => new URL(input.toString()))
        .find((url) => url.pathname === '/api/busqueda' && url.searchParams.has('genero'));
      expect(solicitud).toBeDefined();
      expect(solicitud.searchParams.has('q')).toBe(false);
      expect(solicitud.searchParams.get('genero')).toBe('drama');
    });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Resultados con los filtros seleccionados' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Género')).toHaveValue('');
      expect(screen.getByTestId('parametros-url')).toBeEmptyDOMElement();
      expect(
        screen.queryByRole('heading', {
          level: 2,
          name: 'Resultados con los filtros seleccionados',
        }),
      ).not.toBeInTheDocument();
    });
  });

  it('permite borrar una búsqueda por nombre aunque no haya otros filtros', async () => {
    const fetchMock = configurarFetchConOpciones();
    render(
      <>
        <PaginaBusqueda />
        <UbicacionActual />
      </>,
    );
    await ejecutarBusqueda();

    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument();
    const cantidadSolicitudes = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Título')).toHaveValue('');
      expect(screen.getByTestId('parametros-url')).toBeEmptyDOMElement();
      expect(screen.queryByRole('heading', { level: 3, name: 'Dune' })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(cantidadSolicitudes);
  });

  it('al limpiar una búsqueda restaurada desde la URL no la ejecuta otra vez', async () => {
    const fetchMock = configurarFetchConOpciones();
    render(
      <>
        <PaginaBusqueda />
        <UbicacionActual />
      </>,
      { initialEntries: ['/?q=Dune&pagina=1'] },
    );
    await screen.findByRole('heading', { level: 3, name: 'Dune' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Título')).toHaveValue('');
      expect(screen.getByTestId('parametros-url')).toBeEmptyDOMElement();
      expect(screen.queryByRole('heading', { level: 3, name: 'Dune' })).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('combina los filtros de género, actor y director', async () => {
    const fetchMock = configurarFetchConOpciones();
    render(
      <>
        <PaginaBusqueda />
        <UbicacionActual />
      </>,
    );
    await ejecutarBusqueda();

    const campoGenero = screen.getByLabelText('Género');
    fireEvent.focus(campoGenero);
    await screen.findByRole('option', { name: 'Drama' });
    fireEvent.change(campoGenero, { target: { value: 'drama' } });

    const campoActor = screen.getByRole('combobox', { name: 'Actor' });
    fireEvent.change(campoActor, { target: { value: 'Leonardo' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Leonardo DiCaprio' }));

    const campoDirector = screen.getByRole('combobox', { name: 'Director' });
    fireEvent.change(campoDirector, { target: { value: 'Christopher' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Christopher Nolan' }));

    await waitFor(() => {
      const solicitudes = fetchMock.mock.calls.filter(
        ([url]) => new URL(url.toString()).pathname === '/api/busqueda',
      );
      const ultima = new URL(solicitudes.at(-1)[0].toString());
      expect(ultima.searchParams.get('genero')).toBe('drama');
      expect(ultima.searchParams.get('actor')).toBe('6193');
      expect(ultima.searchParams.get('director')).toBe('525');
      expect(ultima.searchParams.has('actorNombre')).toBe(false);
      expect(ultima.searchParams.has('directorNombre')).toBe(false);
    });

    const botonBuscar = screen.getByRole('button', { name: 'Buscar' });
    const botonLimpiar = screen.getByRole('button', { name: 'Limpiar filtros' });
    expect(botonBuscar.parentElement).toBe(botonLimpiar.parentElement);
  });

  it('reinicia los filtros al ejecutar otra consulta con un título distinto', async () => {
    const fetchMock = configurarFetchConOpciones();
    render(<PaginaBusqueda />, {
      sesion: CON_SESION,
      propias: plataformasPropias([1]),
    });
    await ejecutarBusqueda();

    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'pelicula' } });
    fireEvent.change(screen.getByLabelText('Año'), { target: { value: '2021' } });

    const campoGenero = screen.getByLabelText('Género');
    fireEvent.focus(campoGenero);
    await screen.findByRole('option', { name: 'Drama' });
    fireEvent.change(campoGenero, { target: { value: 'drama' } });

    const campoActor = screen.getByRole('combobox', { name: 'Actor' });
    fireEvent.change(campoActor, { target: { value: 'Leonardo' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Leonardo DiCaprio' }));

    const campoDirector = screen.getByRole('combobox', { name: 'Director' });
    fireEvent.change(campoDirector, { target: { value: 'Christopher' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Christopher Nolan' }));

    fireEvent.click(screen.getByRole('switch', { name: 'Solo mis plataformas' }));
    await screen.findByRole('button', { name: 'Buscar' });

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Matrix' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      const url = fetchMock.mock.calls
        .map(([input]) => new URL(input.toString()))
        .filter((solicitud) => solicitud.searchParams.get('q') === 'Matrix')
        .at(-1);
      expect(url).toBeDefined();
      expect(url.pathname).toBe('/api/busqueda');
      expect(url.searchParams.get('q')).toBe('Matrix');
      expect(url.searchParams.has('tipo')).toBe(false);
      expect(url.searchParams.has('anio')).toBe(false);
      expect(url.searchParams.has('genero')).toBe(false);
      expect(url.searchParams.has('actor')).toBe(false);
      expect(url.searchParams.has('director')).toBe(false);
    });
    expect(screen.getByLabelText('Tipo')).toHaveValue('');
    expect(screen.getByLabelText('Año')).toHaveValue(null);
    expect(screen.getByLabelText('Género')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Actor' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Director' })).toHaveValue('');
    expect(screen.getByRole('switch', { name: 'Solo mis plataformas' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('mantiene el género al cargar la página siguiente sin repetir títulos', async () => {
    const matriz = {
      ...respuestaConResultados.data.resultados[0],
      tmdbId: 2,
      nombre: 'Matrix',
    };
    const fetchMock = configurarFetchConOpciones({
      data: {
        resultados: [respuestaConResultados.data.resultados[0]],
        pagina: 1,
        totalResultados: 50,
        totalPaginas: 2,
      },
    });
    fetchMock.mockImplementation(async (input) => {
      const url = new URL(input.toString());
      if (url.pathname === '/api/busqueda/generos') {
        return { ok: true, json: async () => ({ data: [{ id: 'drama', nombre: 'Drama' }] }) };
      }
      const pagina = Number(url.searchParams.get('pagina'));
      const data = {
        resultados: [pagina === 1 ? respuestaConResultados.data.resultados[0] : matriz],
        pagina,
        totalResultados: 50,
        totalPaginas: 2,
      };
      return { ok: true, json: async () => ({ data }) };
    });

    render(<PaginaBusqueda />);
    await ejecutarBusqueda();
    fireEvent.focus(screen.getByLabelText('Género'));
    await screen.findByRole('option', { name: 'Drama' });
    fireEvent.change(screen.getByLabelText('Género'), { target: { value: 'drama' } });
    await screen.findByRole('button', { name: 'Cargar más' });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más' }));

    expect(await screen.findByRole('heading', { level: 3, name: 'Matrix' })).toBeInTheDocument();
    const solicitudSiguiente = fetchMock.mock.calls
      .map(([input]) => new URL(input.toString()))
      .find((url) => url.pathname === '/api/busqueda' && url.searchParams.get('pagina') === '2');
    expect(solicitudSiguiente.searchParams.get('genero')).toBe('drama');
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('informa que no hay coincidencias y permite limpiar los filtros', async () => {
    const fetchMock = vi.fn(async (input) => {
      const url = new URL(input.toString());
      const data =
        url.pathname === '/api/busqueda/generos'
          ? [{ id: 'drama', nombre: 'Drama' }]
          : url.searchParams.has('genero')
            ? { resultados: [], pagina: 1, totalResultados: 10, totalPaginas: 1 }
            : respuestaConResultados.data;
      return { ok: true, json: async () => ({ data }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<PaginaBusqueda />);
    await ejecutarBusqueda();
    const campoGenero = screen.getByLabelText('Género');
    fireEvent.focus(campoGenero);
    await screen.findByRole('option', { name: 'Drama' });
    fireEvent.change(campoGenero, { target: { value: 'drama' } });

    expect(
      await screen.findByText('No hay resultados para esa combinación de filtros.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Limpiar filtros' })).toHaveLength(1);
    const cantidadSolicitudes = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Título')).toHaveValue('Dune');
      expect(screen.getByLabelText('Género')).toHaveValue('');
      expect(
        screen.queryByText('No hay resultados para esa combinación de filtros.'),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Dune' })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(cantidadSolicitudes + 1);
  });

  it('permite reintentar si falla el proveedor al buscar resultados filtrados', async () => {
    let fallarBusquedaFiltrada = true;
    const fetchMock = vi.fn(async (input) => {
      const url = new URL(input.toString());
      if (url.pathname === '/api/busqueda/generos') {
        return { ok: true, json: async () => ({ data: [{ id: 'drama', nombre: 'Drama' }] }) };
      }
      if (url.searchParams.has('genero') && fallarBusquedaFiltrada) {
        return {
          ok: false,
          json: async () => ({
            error: { code: 'EXTERNAL_SERVICE', message: 'No se pudo consultar TMDB' },
          }),
        };
      }
      return { ok: true, json: async () => respuestaConResultados };
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<PaginaBusqueda />);
    await ejecutarBusqueda();
    const campoGenero = screen.getByLabelText('Género');
    fireEvent.focus(campoGenero);
    await screen.findByRole('option', { name: 'Drama' });
    fireEvent.change(campoGenero, { target: { value: 'drama' } });

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo consultar TMDB');
    fallarBusquedaFiltrada = false;
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { level: 3, name: 'Dune' })).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([input]) => {
        const url = new URL(input.toString());
        return url.pathname === '/api/busqueda' && url.searchParams.get('genero') === 'drama';
      }),
    ).toBe(true);
  });
});
