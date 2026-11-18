import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render as renderComponent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { ESTADOS_ANIMO } from '@buscador/shared/constants';
import { SessionContext } from '../../contexts/session/SessionContext.js';
import { PlataformasPropiasContext } from '../../contexts/plataformasPropias/PlataformasPropiasContext.js';
import { RUTAS, rutaDetalle } from '../../app/rutas.js';
import { PaginaAnimo } from './PaginaAnimo.jsx';

const SIN_SESION = { user: null, loading: false };
const CON_SESION = { user: { id: 'u1', email: 'ana@mail.com' }, loading: false };
const NETFLIX = { id: 1, tmdbProviderId: 8, nombre: 'Netflix', logoPath: null };

function plataformasPropias(ids = []) {
  return { seleccionadas: new Set(ids), loading: false, error: '' };
}

function titulo(tmdbId, extra = {}) {
  return {
    tmdbId,
    tipo: 'pelicula',
    nombre: `Título ${tmdbId}`,
    anio: 2020,
    posterUrl: null,
    puntuacion: 7.5,
    ...extra,
  };
}

function pagina(resultados, { numero = 1, totalPaginas = 1, ...extra } = {}) {
  return { resultados, pagina: numero, totalResultados: resultados.length, totalPaginas, ...extra };
}

function respuestaOk(data) {
  return { ok: true, json: async () => ({ data }) };
}

// Responde según la URL pedida: `responder(url)` devuelve la página de la API.
function configurarFetch(responder = () => pagina([titulo(1)])) {
  const fetchMock = vi.fn(async (url) => respuestaOk(responder(new URL(url))));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function urlsPedidas() {
  return fetch.mock.calls.map(([url]) => {
    const { pathname, search } = new URL(url);
    return `${pathname}${search}`;
  });
}

function UbicacionActual() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacion">{`${pathname}${search}`}</output>;
}

function render({ sesion = SIN_SESION, propias = plataformasPropias(), ruta = RUTAS.ANIMO } = {}) {
  return renderComponent(
    <SessionContext.Provider value={sesion}>
      <PlataformasPropiasContext.Provider value={propias}>
        <MemoryRouter initialEntries={[ruta]}>
          <Routes>
            <Route path={RUTAS.ANIMO} element={<PaginaAnimo />} />
            <Route path={RUTAS.DETALLE_TITULO} element={<h1>Detalle del título</h1>} />
          </Routes>
          <UbicacionActual />
        </MemoryRouter>
      </PlataformasPropiasContext.Provider>
    </SessionContext.Provider>,
  );
}

function elegir(nombre) {
  fireEvent.click(screen.getByRole('radio', { name: nombre }));
}

beforeEach(() => {
  configurarFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PaginaAnimo', () => {
  it('muestra la lista fija de estados de ánimo sin buscar todavía', () => {
    render();

    expect(screen.getAllByRole('radio').map((radio) => radio.value)).toEqual(
      ESTADOS_ANIMO.map(({ id }) => id),
    );
    expect(screen.getByRole('radio', { name: 'Para reír' })).toHaveAccessibleDescription(
      ESTADOS_ANIMO[0].descripcion,
    );
    expect(screen.getByText('Elegí un estado de ánimo para ver sugerencias.')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('busca por el estado elegido sin sesión y lo guarda en la URL', async () => {
    render();

    elegir('Para reír');

    expect(await screen.findByRole('heading', { level: 3, name: 'Título 1' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Para reír' })).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 título')).toBeInTheDocument();
    expect(urlsPedidas()).toEqual(['/api/busqueda/animo?animo=para-reir&pagina=1']);
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/segun-tu-animo?animo=para-reir');
    expect(screen.queryByRole('switch', { name: 'Solo mis plataformas' })).not.toBeInTheDocument();
  });

  it('abre el detalle del título desde la tarjeta', async () => {
    render({ ruta: `${RUTAS.ANIMO}?animo=con-tension` });

    fireEvent.click(await screen.findByRole('link', { name: 'Ver detalle de Título 1' }));

    expect(screen.getByRole('heading', { name: 'Detalle del título' })).toBeInTheDocument();
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(rutaDetalle('pelicula', 1));
  });

  it('carga más sin repetir títulos y al cambiar de estado vuelve a la primera página', async () => {
    configurarFetch((url) => {
      if (url.searchParams.get('animo') === 'para-pensar') {
        return pagina([titulo(30)]);
      }
      return url.searchParams.get('pagina') === '1'
        ? pagina([titulo(1), titulo(2)], { totalPaginas: 3 })
        : pagina([titulo(2), titulo(3)], { numero: 2, totalPaginas: 3 });
    });
    render({ ruta: `${RUTAS.ANIMO}?animo=para-reir` });

    fireEvent.click(await screen.findByRole('button', { name: 'Cargar más' }));

    expect(await screen.findByRole('heading', { level: 3, name: 'Título 3' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Título 1',
      'Título 2',
      'Título 3',
    ]);

    elegir('Para pensar');

    expect(await screen.findByRole('heading', { level: 3, name: 'Título 30' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Título 1' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cargar más' })).not.toBeInTheDocument();
    expect(urlsPedidas().at(-1)).toBe('/api/busqueda/animo?animo=para-pensar&pagina=1');
  });

  it('filtra por mis plataformas si tengo sesión y plataformas elegidas', async () => {
    configurarFetch((url) =>
      url.pathname.endsWith('/propias')
        ? pagina([titulo(5, { plataformas: [NETFLIX] })], { verificacionIncompleta: false })
        : pagina([titulo(1), titulo(5)]),
    );
    render({
      sesion: CON_SESION,
      propias: plataformasPropias([1]),
      ruta: `${RUTAS.ANIMO}?animo=para-reir`,
    });
    await screen.findByRole('heading', { level: 3, name: 'Título 1' });

    fireEvent.click(screen.getByRole('switch', { name: 'Solo mis plataformas' }));

    await waitFor(() =>
      expect(screen.queryByRole('heading', { level: 3, name: 'Título 1' })).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('link', { name: 'Ver detalle de Título 5, disponible en Netflix' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1 título de tus plataformas')).toBeInTheDocument();
    expect(screen.getByText(/Datos de disponibilidad/)).toBeInTheDocument();
    expect(urlsPedidas().at(-1)).toBe('/api/busqueda/animo/propias?animo=para-reir&pagina=1');
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('propias=true');
  });

  it('muestra todo y ofrece elegir plataformas si el usuario no tiene ninguna', async () => {
    render({ sesion: CON_SESION, ruta: `${RUTAS.ANIMO}?animo=para-reir&propias=true` });

    expect(await screen.findByRole('heading', { level: 3, name: 'Título 1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Elegí tus plataformas' })).toHaveAttribute(
      'href',
      RUTAS.MIS_PLATAFORMAS,
    );
    expect(screen.getByRole('switch', { name: 'Solo mis plataformas' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(urlsPedidas()).toEqual(['/api/busqueda/animo?animo=para-reir&pagina=1']);
  });

  it('avisa si nada está en mis plataformas y permite quitar el filtro', async () => {
    configurarFetch((url) =>
      url.pathname.endsWith('/propias')
        ? pagina([], { verificacionIncompleta: false })
        : pagina([titulo(1)]),
    );
    render({
      sesion: CON_SESION,
      propias: plataformasPropias([1]),
      ruta: `${RUTAS.ANIMO}?animo=para-reir&propias=true`,
    });

    expect(
      await screen.findByText(
        'Ninguno de los títulos encontrados está disponible en tus plataformas.',
      ),
    ).toBeInTheDocument();
    expect(urlsPedidas()).toEqual(['/api/busqueda/animo/propias?animo=para-reir&pagina=1']);

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos los resultados' }));

    expect(await screen.findByRole('heading', { level: 3, name: 'Título 1' })).toBeInTheDocument();
    expect(screen.getByTestId('ubicacion')).not.toHaveTextContent('propias');
  });

  it('muestra un error recuperable si falla el proveedor', async () => {
    const fetchMock = configurarFetch();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: { code: 'EXTERNAL_SERVICE', message: 'TMDB no responde' } }),
    });
    render({ ruta: `${RUTAS.ANIMO}?animo=algo-liviano` });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos traer sugerencias en este momento. Probá de nuevo.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { level: 3, name: 'Título 1' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('no busca si el estado de ánimo de la URL no existe', () => {
    render({ ruta: `${RUTAS.ANIMO}?animo=aburrido` });

    expect(
      screen.getByText('Ese estado de ánimo no existe. Elegí uno de la lista.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio').every((radio) => !radio.checked)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
});
