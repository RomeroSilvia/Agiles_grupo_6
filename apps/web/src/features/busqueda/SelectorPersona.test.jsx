import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SelectorPersona } from './SelectorPersona.jsx';

function SelectorPersonaPrueba({ rol, etiqueta, onChange }) {
  const [consulta, setConsulta] = useState('');
  const [persona, setPersona] = useState(null);

  return (
    <SelectorPersona
      rol={rol}
      etiqueta={etiqueta}
      persona={persona}
      consulta={consulta}
      onConsultaChange={(valor) => {
        setConsulta(valor);
        if (persona) {
          setPersona(null);
        }
      }}
      onSeleccionar={(seleccionada) => {
        setPersona(seleccionada);
        onChange(seleccionada);
      }}
    />
  );
}

describe('SelectorPersona', () => {
  it('busca y selecciona personas por nombre', async () => {
    const onChange = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ id: 6193, nombre: 'Leonardo DiCaprio', fotoUrl: null }],
        }),
      }),
    );
    render(<SelectorPersonaPrueba rol="actor" etiqueta="Actor" onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Actor' }), {
      target: { value: 'Leo' },
    });
    fireEvent.click(await screen.findByRole('option', { name: 'Leonardo DiCaprio' }));

    expect(onChange).toHaveBeenCalledWith({
      id: 6193,
      nombre: 'Leonardo DiCaprio',
      fotoUrl: null,
    });
    expect(screen.getByRole('combobox', { name: 'Actor' })).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Quitar actor' })).not.toBeInTheDocument();
  });

  it('usa texto para evitar el botón de borrado nativo y deja vacío el campo al elegir', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 6193, nombre: 'Leonardo DiCaprio', fotoUrl: null }] }),
      }),
    );
    render(<SelectorPersonaPrueba rol="actor" etiqueta="Actor" onChange={vi.fn()} />);

    const input = screen.getByRole('combobox', { name: 'Actor' });
    expect(input).toHaveAttribute('type', 'text');
    fireEvent.change(input, { target: { value: 'Leo' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Leonardo DiCaprio' }));

    expect(input).toHaveValue('');
  });

  it('permite recorrer y seleccionar sugerencias con el teclado', async () => {
    const onChange = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 6193, nombre: 'Leonardo DiCaprio', fotoUrl: null },
            { id: 1245, nombre: 'Leonardo Nam', fotoUrl: null },
          ],
        }),
      }),
    );
    render(<SelectorPersonaPrueba rol="actor" etiqueta="Actor" onChange={onChange} />);

    const input = screen.getByRole('combobox', { name: 'Actor' });
    fireEvent.change(input, { target: { value: 'Leo' } });
    await screen.findByRole('option', { name: 'Leonardo DiCaprio' });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant');
    expect(screen.getByRole('option', { name: 'Leonardo DiCaprio' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(false);

    expect(onChange).toHaveBeenCalledWith({
      id: 6193,
      nombre: 'Leonardo DiCaprio',
      fotoUrl: null,
    });
    expect(screen.getByRole('combobox', { name: 'Actor' })).toHaveValue('');
  });

  it('cierra las sugerencias con Escape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 6193, nombre: 'Leonardo DiCaprio', fotoUrl: null }] }),
      }),
    );
    render(<SelectorPersonaPrueba rol="actor" etiqueta="Actor" onChange={vi.fn()} />);

    const input = screen.getByRole('combobox', { name: 'Actor' });
    fireEvent.change(input, { target: { value: 'Leo' } });
    await screen.findByRole('option', { name: 'Leonardo DiCaprio' });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('muestra un error recuperable cuando falla la búsqueda de personas', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { code: 'EXTERNAL_SERVICE', message: 'No se pudo consultar TMDB' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 525, nombre: 'Christopher Nolan', fotoUrl: null }] }),
      });
    vi.stubGlobal('fetch', fetchMock);
    render(<SelectorPersonaPrueba rol="director" etiqueta="Director" onChange={vi.fn()} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Director' }), {
      target: { value: 'Chris' },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo consultar TMDB');

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('option', { name: 'Christopher Nolan' })).toBeInTheDocument();
  });
});
