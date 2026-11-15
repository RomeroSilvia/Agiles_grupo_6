import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CINES_FIXTURE } from '@buscador/shared/testing';
import { FiltrosFunciones } from './FiltrosFunciones.jsx';
describe('FiltrosFunciones', () => {
  it('conserva el ID de cada opción y combina cada cambio con el otro filtro', () => {
    const cambiarFiltros = vi.fn();
    const limpiar = vi.fn();
    render(
      <FiltrosFunciones
        fechas={['2026-11-15']}
        cines={CINES_FIXTURE}
        fecha=""
        cineId={CINES_FIXTURE[0].id}
        cambiarFiltros={cambiarFiltros}
        limpiar={limpiar}
      />,
    );
    expect(screen.getByRole('option', { name: '15 de noviembre de 2026' })).toHaveValue(
      '2026-11-15',
    );
    expect(screen.getByRole('option', { name: /Calle 1 123/ })).toHaveValue(CINES_FIXTURE[0].id);
    fireEvent.change(screen.getByRole('combobox', { name: 'Fecha de la función' }), {
      target: { value: '2026-11-15' },
    });
    expect(cambiarFiltros).toHaveBeenCalledWith({
      fecha: '2026-11-15',
      cineId: CINES_FIXTURE[0].id,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(limpiar).toHaveBeenCalledOnce();
  });
});
