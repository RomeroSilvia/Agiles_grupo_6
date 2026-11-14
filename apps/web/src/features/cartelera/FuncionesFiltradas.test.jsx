import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { crearRespuestaFuncionesFixture, CINES_FIXTURE } from '@buscador/shared/testing';
import { FuncionesFiltradas } from './FuncionesFiltradas.jsx';

describe('controles de filtros de funciones', () => {
  it('usa labels accesibles, desambigua cines y permite limpiar el vacío', () => {
    render(<FuncionesFiltradas data={crearRespuestaFuncionesFixture()} />);
    expect(screen.getByRole('option', { name: 'Cine Central — Calle 1 123' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cine Central — Calle 2 123' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Fecha de la función' }), {
      target: { value: '2026-11-16' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Cine' }), {
      target: { value: CINES_FIXTURE[1].id },
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'No se encontraron funciones para estos filtros en los datos recibidos',
    );
    expect(screen.getByRole('option', { name: '2026-11-15' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByText('00:30')).toBeInTheDocument();
  });
  it('no llama vacío de filtros al origen vacío ni muestra controles de datos viejos durante carga', () => {
    const { rerender } = render(<FuncionesFiltradas data={crearRespuestaFuncionesFixture()} />);
    rerender(<FuncionesFiltradas data={null} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText('00:30')).not.toBeInTheDocument();
    rerender(
      <FuncionesFiltradas
        data={crearRespuestaFuncionesFixture({ cines: [], funciones: [], estado: 'sin_funciones' })}
      />,
    );
    expect(
      screen.queryByText(/No se encontraron funciones para estos filtros/),
    ).not.toBeInTheDocument();
  });
});
