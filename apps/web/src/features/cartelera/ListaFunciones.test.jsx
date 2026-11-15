import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { CINES_FIXTURE, FUNCIONES_FIXTURE } from '@buscador/shared/testing';
import { ListaFunciones } from './ListaFunciones.jsx';
describe('ListaFunciones', () => {
  it('agrupa por cine y fecha, ordena horarios y muestra la fuente entregada por la API', () => {
    const funciones = [...FUNCIONES_FIXTURE].reverse().map((funcion) => ({
      ...funcion,
      fuentes: funcion.fuentes.map((fuente) => ({ ...fuente, nombre: 'Fuente de prueba' })),
    }));
    render(
      <ListaFunciones
        cines={CINES_FIXTURE}
        funciones={funciones}
        renderAccion={() => <button>Ver sitio</button>}
      />,
    );
    const cines = screen.getAllByRole('article');
    expect(cines).toHaveLength(2);
    expect(within(cines[0]).getByText('Calle 1 123')).toBeVisible();
    expect(
      within(cines[0]).getByRole('heading', { name: '15 de noviembre de 2026' }),
    ).toBeVisible();
    expect(
      within(cines[0])
        .getAllByRole('listitem')
        .map((item) => item.querySelector('time').textContent),
    ).toEqual(['00:30', '20:00']);
    expect(screen.getAllByText('Fuente: Fuente de prueba')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Ver sitio' })).toHaveLength(3);
    expect(screen.queryByText(/America\/Argentina/)).not.toBeInTheDocument();
  });
  it('omite cines que no tienen funciones en la selección', () => {
    render(<ListaFunciones cines={CINES_FIXTURE} funciones={[]} />);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
