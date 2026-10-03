import { describe, it, expect, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderRoute } from '../test/renderRoute.jsx';

const resultadoDune = {
  tmdbId: 1,
  tipo: 'pelicula',
  nombre: 'Dune',
  anio: 2021,
  posterUrl: null,
  puntuacion: 8.1,
};

const detalleDune = {
  ...resultadoDune,
  sinopsis: 'En un futuro lejano...',
};

function configurarFetch() {
  const fetchMock = vi.fn((input) => {
    const url = new URL(input.toString(), window.location.origin);

    if (url.pathname === '/api/auth/session') {
      return Promise.resolve({ ok: true, json: async () => ({ data: { user: null } }) });
    }

    if (url.pathname === '/api/region') {
      return Promise.resolve({ ok: true, json: async () => ({ data: { region: 'AR' } }) });
    }

    if (url.pathname === '/api/busqueda') {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: {
            resultados: [resultadoDune],
            pagina: 1,
            totalResultados: 1,
            totalPaginas: 1,
          },
        }),
      });
    }

    if (url.pathname === '/api/titulos/pelicula/1') {
      return Promise.resolve({ ok: true, json: async () => ({ data: detalleDune }) });
    }

    throw new Error(`URL no mockeada: ${url.pathname}`);
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('router de la aplicación', () => {
  it('navega de una tarjeta a la ficha y conserva la búsqueda al volver', async () => {
    const fetchMock = configurarFetch();
    const user = userEvent.setup();

    renderRoute('/');

    await user.type(screen.getByLabelText('Título'), 'Dune');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('heading', { level: 3, name: 'Dune' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Ver detalle de Dune' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Dune' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Volver a la búsqueda' }));
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Resultados para "Dune"' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('Dune');
    expect(screen.getByRole('heading', { level: 3, name: 'Dune' })).toBeInTheDocument();

    const llamadasDeBusqueda = fetchMock.mock.calls.filter(([input]) => {
      const url = new URL(input.toString(), window.location.origin);
      return url.pathname === '/api/busqueda';
    });
    expect(llamadasDeBusqueda).toHaveLength(1);
  });
});
