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
        posterPath: null,
        puntuacion: 8.1,
      },
    ],
    pagina: 1,
    totalResultados: 1,
    totalPaginas: 1,
  },
};

function configurarFetch(respuesta = respuestaConResultados) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => respuesta,
    }),
  );
}

beforeEach(() => {
  configurarFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PaginaBusqueda', () => {
  it('busca y muestra resultados', async () => {
    render(<PaginaBusqueda />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Dune' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Dune' })).toBeInTheDocument();
    const [url] = fetch.mock.calls[0];
    expect(url.toString()).toContain('/api/busqueda?q=Dune&pagina=1');
  });

  it('vuelve a buscar al combinar tipo y año', async () => {
    render(<PaginaBusqueda />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Dune' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('heading', { level: 2, name: 'Dune' });

    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'serie' } });
    fireEvent.change(screen.getByLabelText('Año'), { target: { value: '2024' } });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    const [url] = fetch.mock.calls[2];
    expect(url.toString()).toContain('tipo=serie');
    expect(url.toString()).toContain('anio=2024');
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
