import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ListaProximosEstrenos } from './ListaProximosEstrenos.jsx';
import { FechaEstrenoCine } from './FechaEstrenoCine.jsx';
import { request } from '../../services/api.service.js';

vi.mock('../../services/api.service.js', () => ({ request: vi.fn() }));
afterEach(() => vi.clearAllMocks());
const fuente = {
  fuenteId: 'tmdb',
  registroId: null,
  url: null,
  actualizadoEn: null,
  consultadoEn: '2026-11-14T12:00:00Z',
};
const vacio = {
  region: 'AR',
  desde: '2027-01-01',
  hasta: '2027-01-30',
  resultados: [],
  pagina: 1,
  totalResultados: 0,
  totalPaginas: 0,
  fuente,
};
describe('ListaProximosEstrenos', () => {
  it('distingue error, reintento y vacío y valida el período localmente', async () => {
    request.mockRejectedValueOnce(new Error('Fuente caída')).mockResolvedValue(vacio);
    render(
      <MemoryRouter>
        <ListaProximosEstrenos />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Fuente caída')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText(/No se encontraron próximos estrenos/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2027-02-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2027-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar período' }));
    expect(screen.getByText(/Elegí un período futuro/)).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('explica una fecha pendiente sin inventarla', () => {
    render(<FechaEstrenoCine pelicula={{ fechaEstrenoAr: null }} />);
    expect(screen.getByText(/Fecha pendiente de confirmación/)).toHaveTextContent(
      'Sin fecha, fuera del período fechado',
    );
  });
});
