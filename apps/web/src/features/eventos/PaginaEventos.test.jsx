import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import plazaMorenoLaPlata from '../../assets/plaza-moreno-la-plata.jpg';
import { PaginaEventos } from './PaginaEventos.jsx';
import { EVENTO_FIXTURE, crearRespuestaEventos } from './eventos.fixture.js';

const http = (data, status = 200) => ({
  ok: status === 200,
  status,
  json: async () => (status === 200 ? { data } : data),
});
function renderPagina() {
  render(
    <MemoryRouter>
      <PaginaEventos />
    </MemoryRouter>,
  );
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Cooltura en La Plata', () => {
  it('muestra eventos, fuente y enlaces seguros sin iniciar sesión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(http(crearRespuestaEventos())));
    renderPagina();
    expect(
      screen.getByRole('heading', { level: 1, name: 'La próxima historia la podés vivir afuera' }),
    ).toBeInTheDocument();
    const tituloEvento = await screen.findByRole('heading', { name: EVENTO_FIXTURE.nombre });
    expect(tituloEvento).toBeInTheDocument();
    expect(within(tituloEvento.closest('article')).getByRole('presentation')).toHaveAttribute(
      'src',
      plazaMorenoLaPlata,
    );
    expect(
      within(tituloEvento.closest('article')).getByText('25 de noviembre de 2026'),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Ver Teatro bajo las estrellas en AllEvents/ });
    expect(link).toHaveAttribute('href', EVENTO_FIXTURE.url);
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('Gratis')).toBeInTheDocument();
  });
  it('cambia filtros y reinicia la categoría al consultar por período', async () => {
    const fetchMock = vi.fn().mockResolvedValue(http(crearRespuestaEventos()));
    vi.stubGlobal('fetch', fetchMock);
    renderPagina();
    await screen.findByRole('heading', { name: EVENTO_FIXTURE.nombre });
    fireEvent.change(screen.getByRole('combobox', { name: 'Qué te gusta' }), {
      target: { value: 'teatro' },
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0].searchParams.get('categoria')).toBe('teatro');
    fireEvent.change(screen.getByRole('combobox', { name: 'Cuándo salimos' }), {
      target: { value: 'fin_de_semana' },
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[2][0].searchParams.get('fecha')).toBe('fin_de_semana');
    expect(screen.getByRole('combobox', { name: 'Qué te gusta' })).toHaveValue('todas');
  });
  it('acumula páginas sin repetir eventos', async () => {
    const otro = {
      ...EVENTO_FIXTURE,
      id: 'evento-2',
      nombre: 'Festival del barrio',
      imagenUrl: 'https://cdn-az.allevents.in/events/poster.jpg',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(http(crearRespuestaEventos([EVENTO_FIXTURE], { siguientePagina: 2 })))
      .mockResolvedValueOnce(http(crearRespuestaEventos([EVENTO_FIXTURE, otro], { pagina: 2 })));
    vi.stubGlobal('fetch', fetchMock);
    renderPagina();
    fireEvent.click(await screen.findByRole('button', { name: 'Cargar más eventos' }));
    const otroTitulo = await screen.findByRole('heading', { name: otro.nombre });
    expect(otroTitulo).toBeInTheDocument();
    expect(within(otroTitulo.closest('article')).getByRole('presentation')).toHaveAttribute(
      'src',
      otro.imagenUrl,
    );
    expect(screen.getAllByRole('heading', { name: EVENTO_FIXTURE.nombre })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Cargar más eventos' })).not.toBeInTheDocument();
  });
  it('muestra un error y permite reintentar', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          http(
            { error: { code: 'EXTERNAL_SERVICE', message: 'No se pudo consultar AllEvents' } },
            502,
          ),
        )
        .mockResolvedValueOnce(http(crearRespuestaEventos())),
    );
    renderPagina();
    expect(await screen.findByText('No se pudo consultar AllEvents')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('heading', { name: EVENTO_FIXTURE.nombre })).toBeInTheDocument();
  });
  it('informa cuando no hay eventos para la selección', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(http(crearRespuestaEventos([]))));
    renderPagina();
    expect(
      await screen.findByText(/No encontramos eventos presenciales en La Plata/),
    ).toBeInTheDocument();
  });
  it('descarta una respuesta tardía del filtro anterior aunque el transporte ignore la cancelación', async () => {
    let resolverAnterior;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolverAnterior = resolve;
          }),
      )
      .mockResolvedValue(
        http(crearRespuestaEventos([{ ...EVENTO_FIXTURE, nombre: 'Música en la plaza' }])),
      );
    vi.stubGlobal('fetch', fetchMock);
    renderPagina();
    fireEvent.change(screen.getByRole('combobox', { name: 'Qué te gusta' }), {
      target: { value: 'musica' },
    });
    expect(await screen.findByRole('heading', { name: 'Música en la plaza' })).toBeInTheDocument();
    await act(async () => {
      resolverAnterior(http(crearRespuestaEventos()));
    });
    expect(screen.queryByRole('heading', { name: EVENTO_FIXTURE.nombre })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it('rechaza una respuesta mal formada antes de renderizar enlaces', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          http(crearRespuestaEventos([{ ...EVENTO_FIXTURE, url: 'javascript:alert(1)' }])),
        ),
    );
    renderPagina();
    expect(
      await screen.findByText('No pudimos interpretar los eventos recibidos. Probá de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver evento/ })).not.toBeInTheDocument();
  });
});
