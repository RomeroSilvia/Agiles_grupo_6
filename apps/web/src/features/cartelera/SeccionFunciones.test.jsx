import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { CIUDAD_CINE_FIXTURE, crearRespuestaFuncionesFixture } from '@buscador/shared/testing';
import { SeccionFunciones } from './SeccionFunciones.jsx';
import { request } from '../../services/api.service.js';

const contexto = vi.hoisted(() => ({
  ciudades: [],
  idCiudadSeleccionada: null,
  loading: false,
  error: '',
  aviso: '',
  cargarDirectorio: vi.fn(),
  seleccionarCiudad: vi.fn(),
  reintentar: vi.fn(),
}));
vi.mock('../../contexts/ciudadCine/CiudadCineContext.js', () => ({
  useCiudadCine: () => contexto,
}));
vi.mock('../../services/api.service.js', () => ({ request: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  contexto.idCiudadSeleccionada = null;
  request.mockResolvedValue(crearRespuestaFuncionesFixture());
});
afterEach(() => vi.restoreAllMocks());
describe('SeccionFunciones', () => {
  it('no restaura resultados viejos al volver a una ciudad mientras hay otra consulta pendiente', async () => {
    contexto.idCiudadSeleccionada = CIUDAD_CINE_FIXTURE.id;
    const { rerender } = render(<SeccionFunciones tmdbId="77" />);
    fireEvent.click(screen.getByRole('button', { name: 'Consultar funciones' }));
    expect(await screen.findByText('00:30')).toBeInTheDocument();
    request.mockImplementation(() => new Promise(() => {}));
    contexto.idCiudadSeleccionada = 'ar:550e8400-e29b-41d4-a716-446655440001';
    rerender(<SeccionFunciones tmdbId="77" />);
    contexto.idCiudadSeleccionada = CIUDAD_CINE_FIXTURE.id;
    rerender(<SeccionFunciones tmdbId="77" />);
    expect(screen.queryByText('00:30')).not.toBeInTheDocument();
    expect(screen.getByText('Consultando funciones…')).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(3);
  });
  it('requiere ciudad y acción explícita, agrupa y conserva advertencias y procedencia', async () => {
    const { rerender } = render(<SeccionFunciones tmdbId="77" />);
    expect(request).not.toHaveBeenCalled();
    contexto.idCiudadSeleccionada = CIUDAD_CINE_FIXTURE.id;
    rerender(<SeccionFunciones tmdbId="77" />);
    expect(request).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Consultar funciones' }));
    expect(await screen.findByText('00:30')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Cine Central' })).toHaveLength(2);
    expect(screen.getByText('Cobertura parcial de prueba')).toBeInTheDocument();
    expect(
      screen.getByText(/Zona horaria: America\/Argentina\/Buenos_Aires\./),
    ).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('descarta respuestas tardías al cambiar ciudad y reinicia al cambiar película', async () => {
    contexto.idCiudadSeleccionada = CIUDAD_CINE_FIXTURE.id;
    let resolverAnterior;
    request.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolverAnterior = resolve;
        }),
    );
    const { rerender } = render(<SeccionFunciones tmdbId="77" />);
    fireEvent.click(screen.getByRole('button', { name: 'Consultar funciones' }));
    const signal = request.mock.calls[0][1].signal;
    contexto.idCiudadSeleccionada = 'ar:550e8400-e29b-41d4-a716-446655440001';
    request.mockResolvedValueOnce(
      crearRespuestaFuncionesFixture({
        ciudad: { ...CIUDAD_CINE_FIXTURE, id: contexto.idCiudadSeleccionada },
        cines: [],
        funciones: [],
        estado: 'sin_funciones',
      }),
    );
    rerender(<SeccionFunciones tmdbId="77" />);
    expect(signal.aborted).toBe(true);
    await act(async () => resolverAnterior(crearRespuestaFuncionesFixture()));
    expect(screen.queryByText('00:30')).not.toBeInTheDocument();
    expect(await screen.findByText(/No se encontraron funciones registradas/)).toBeInTheDocument();
    rerender(<SeccionFunciones tmdbId="78" />);
    expect(screen.queryByText(/No se encontraron funciones registradas/)).not.toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('distingue falla con reintento de vacío y no oculta la selección', async () => {
    contexto.idCiudadSeleccionada = CIUDAD_CINE_FIXTURE.id;
    request.mockRejectedValueOnce(new Error('Fuente no disponible')).mockResolvedValueOnce(
      crearRespuestaFuncionesFixture({
        funciones: [],
        cines: [],
        estado: 'sin_funciones',
        advertencias: [],
      }),
    );
    render(<SeccionFunciones tmdbId="77" />);
    fireEvent.click(screen.getByRole('button', { name: 'Consultar funciones' }));
    expect(await screen.findByText('Fuente no disponible')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText(/No se encontraron funciones registradas/)).toBeInTheDocument();
  });
});
