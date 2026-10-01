import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PaginaBusqueda } from './PaginaBusqueda.jsx';

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
