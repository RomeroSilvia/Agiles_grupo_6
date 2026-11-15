import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination.jsx';

describe('Pagination', () => {
  it('muestra la página actual y avanza o retrocede', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Anterior' }));

    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });

  it('deshabilita «Anterior» en la primera página y «Siguiente» en la última', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    rerender(<Pagination page={3} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('no se muestra si hay una sola página', () => {
    render(<Pagination page={1} totalPages={1} onPageChange={() => {}} />);

    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument();
  });
});
