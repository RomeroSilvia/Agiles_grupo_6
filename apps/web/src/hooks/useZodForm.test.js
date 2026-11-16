import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { z } from 'zod';
import { useZodForm } from './useZodForm.js';

const schema = z.object({
  email: z.email('Ingresá un mail válido'),
  nombre: z.string().trim().min(1, 'Ingresá tu nombre'),
});

function renderForm() {
  return renderHook(() => useZodForm(schema, { email: '', nombre: '' }));
}

function escribir(result, campo, valor) {
  act(() => result.current.field(campo).onChange({ target: { value: valor } }));
}

describe('useZodForm', () => {
  it('muestra el error de un campo recién cuando el usuario sale de él', () => {
    const { result } = renderForm();
    escribir(result, 'email', 'no-es-mail');

    expect(result.current.field('email').error).toBeUndefined();

    act(() => result.current.field('email').onBlur());

    expect(result.current.field('email').error).toBe('Ingresá un mail válido');
  });

  it('al validar muestra todos los errores y devuelve null', () => {
    const { result } = renderForm();

    let datos;
    act(() => {
      datos = result.current.validate();
    });

    expect(datos).toBeNull();
    expect(result.current.field('email').error).toBe('Ingresá un mail válido');
    expect(result.current.field('nombre').error).toBe('Ingresá tu nombre');
  });

  it('devuelve los datos parseados si son válidos y reset vuelve al estado inicial', () => {
    const { result } = renderForm();
    escribir(result, 'email', 'ana@mail.com');
    escribir(result, 'nombre', '  Ana  ');

    let datos;
    act(() => {
      datos = result.current.validate();
    });

    expect(datos).toEqual({ email: 'ana@mail.com', nombre: 'Ana' });

    act(() => result.current.reset());

    expect(result.current.values).toEqual({ email: '', nombre: '' });
    expect(result.current.field('email').error).toBeUndefined();
  });
});
