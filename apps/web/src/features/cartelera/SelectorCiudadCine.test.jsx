import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SelectorCiudadCine } from './SelectorCiudadCine.jsx';
import { useCiudadCine } from '../../contexts/ciudadCine/CiudadCineContext.js';

vi.mock('../../contexts/ciudadCine/CiudadCineContext.js', () => ({
  useCiudadCine: vi.fn(),
}));

const ciudadDisponible = {
  id: 'ar:550e8400-e29b-41d4-a716-446655440000',
  nombre: 'Córdoba',
  provincia: 'Córdoba',
  cobertura: 'disponible',
};

const ciudadSinCobertura = {
  ...ciudadDisponible,
  id: 'ar:550e8400-e29b-41d4-a716-446655440001',
  nombre: 'Villa María',
  cobertura: 'sin_cobertura',
};

function configurarContexto(overrides = {}) {
  useCiudadCine.mockReturnValue({
    ciudades: [ciudadDisponible, ciudadSinCobertura],
    idCiudadSeleccionada: null,
    loading: false,
    error: '',
    aviso: '',
    cargarDirectorio: vi.fn(),
    seleccionarCiudad: vi.fn(),
    reintentar: vi.fn(),
    ...overrides,
  });
}

describe('SelectorCiudadCine', () => {
  it('permite elegir ciudades cubiertas y no ofrece como seleccionable una ciudad sin cobertura', () => {
    const seleccionarCiudad = vi.fn();
    const cargarDirectorio = vi.fn();
    configurarContexto({ seleccionarCiudad, cargarDirectorio });
    render(<SelectorCiudadCine />);

    const selector = screen.getByRole('combobox', { name: 'Seleccioná una ciudad de Argentina' });
    expect(screen.getByRole('option', { name: 'Córdoba, Córdoba' })).toBeEnabled();
    expect(
      screen.getByRole('option', { name: 'Villa María, Córdoba — Sin cobertura' }),
    ).toBeDisabled();

    fireEvent.change(selector, { target: { value: ciudadDisponible.id } });

    expect(seleccionarCiudad).toHaveBeenCalledWith(ciudadDisponible.id);
    expect(cargarDirectorio).toHaveBeenCalledOnce();
  });

  it('permite reintentar cuando falla el directorio', () => {
    const reintentar = vi.fn();
    configurarContexto({ error: 'No se pudo consultar el directorio.', ciudades: [], reintentar });
    render(<SelectorCiudadCine />);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(reintentar).toHaveBeenCalledOnce();
  });

  it('distingue un directorio configurado pero vacío', () => {
    configurarContexto({ ciudades: [] });
    render(<SelectorCiudadCine />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'No hay información de ciudades disponible.',
    );
  });
});
