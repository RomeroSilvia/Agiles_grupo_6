import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { filtrosFuncionesSchema } from '@buscador/shared/schemas';
import { crearRespuestaFuncionesFixture, CINES_FIXTURE } from '@buscador/shared/testing';
import { useFiltrosFunciones } from './useFiltrosFunciones.js';

describe('filtros locales de funciones', () => {
  it('deriva opciones estables y combina fecha civil y cine con AND sin mezclar homónimos', () => {
    const data = crearRespuestaFuncionesFixture();
    const { result } = renderHook(() => useFiltrosFunciones(data));
    expect(result.current.fechas).toEqual(['2026-11-15', '2026-11-16']);
    act(() => result.current.cambiarFiltros({ fecha: '2026-11-15', cineId: '' }));
    expect(result.current.funciones.map((f) => f.horaLocal)).toEqual(['00:30', '22:00']);
    act(() => result.current.cambiarFiltros({ fecha: '', cineId: CINES_FIXTURE[0].id }));
    expect(result.current.funciones).toHaveLength(2);
    act(() => result.current.cambiarFiltros({ fecha: '2026-11-15', cineId: CINES_FIXTURE[0].id }));
    expect(result.current.funciones.map((f) => f.horaLocal)).toEqual(['00:30']);
    expect(result.current.cines).toHaveLength(2);
    expect(result.current.fechas).toHaveLength(2);
    act(() => result.current.limpiar());
    expect(result.current.funciones).toHaveLength(3);
  });
  it.each([
    { fecha: ['2026-11-15'], cineId: '' },
    { fecha: '2026-02-30', cineId: '' },
    { fecha: '', cineId: 'cine:123' },
  ])('rechaza valores mal formados sin aplicarlos: %j', (valores) => {
    expect(filtrosFuncionesSchema.safeParse(valores).success).toBe(false);
    const data = crearRespuestaFuncionesFixture();
    const { result } = renderHook(() => useFiltrosFunciones(data));
    act(() => result.current.cambiarFiltros(valores));
    expect(result.current.funciones).toHaveLength(3);
    expect(result.current.error).not.toBe('');
  });
  it('no aplica opciones ajenas, limpia las retiradas y reinicia al cambiar película o ciudad', () => {
    const data = crearRespuestaFuncionesFixture();
    const { result, rerender } = renderHook(({ dataset }) => useFiltrosFunciones(dataset), {
      initialProps: { dataset: data },
    });
    act(() => result.current.cambiarFiltros({ fecha: '', cineId: `cine:${'a'.repeat(64)}` }));
    expect(result.current.cineId).toBe('');
    act(() => result.current.cambiarFiltros({ fecha: '2026-11-16', cineId: CINES_FIXTURE[0].id }));
    rerender({
      dataset: crearRespuestaFuncionesFixture({
        funciones: [data.funciones[2]],
        cines: [data.cines[1]],
      }),
    });
    expect(result.current.fecha).toBe('');
    expect(result.current.cineId).toBe('');
    expect(result.current.aviso).toMatch(/Se limpiaron filtros/);
    rerender({ dataset: data });
    expect(result.current.cineId).toBe('');
    act(() => result.current.cambiarFiltros({ fecha: '2026-11-15', cineId: CINES_FIXTURE[1].id }));
    rerender({ dataset: crearRespuestaFuncionesFixture({ tmdbId: 78 }) });
    expect(result.current.fecha).toBe('');
    expect(result.current.cineId).toBe('');
    act(() => result.current.cambiarFiltros({ fecha: '2026-11-15', cineId: CINES_FIXTURE[1].id }));
    rerender({
      dataset: crearRespuestaFuncionesFixture({
        tmdbId: 78,
        ciudad: { ...data.ciudad, id: 'ar:550e8400-e29b-41d4-a716-446655440001' },
      }),
    });
    expect(result.current.cineId).toBe('');
  });
  it('conserva opciones durante la actualización sin exponer resultados viejos y maneja origen vacío', () => {
    const data = crearRespuestaFuncionesFixture();
    const { result, rerender } = renderHook(({ dataset }) => useFiltrosFunciones(dataset), {
      initialProps: { dataset: data },
    });
    act(() => result.current.cambiarFiltros({ fecha: '2026-11-16', cineId: '' }));
    rerender({ dataset: null });
    expect(result.current.funciones).toEqual([]);
    rerender({ dataset: data });
    expect(result.current.fecha).toBe('2026-11-16');
    rerender({
      dataset: crearRespuestaFuncionesFixture({
        funciones: [],
        cines: [],
        estado: 'sin_funciones',
      }),
    });
    expect(result.current.funciones).toEqual([]);
    expect(result.current.fecha).toBe('');
  });
});
