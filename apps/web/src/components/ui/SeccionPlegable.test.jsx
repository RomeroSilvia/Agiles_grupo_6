import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SeccionPlegable } from './SeccionPlegable.jsx';

describe('SeccionPlegable', () => {
  it('mantiene el acordeón plegable en todos los tamaños cuando plegableEnEscritorio es true', () => {
    render(
      <SeccionPlegable
        titulo="Comparar disponibilidad en otras regiones"
        resumen="Hasta 5 regiones"
        nivelTitulo="h3"
        plegableEnEscritorio
      >
        <p>Contenido interno</p>
      </SeccionPlegable>,
    );

    const encabezados = screen.getAllByRole('heading', {
      level: 3,
      name: /Comparar disponibilidad en otras regiones/,
    });
    expect(encabezados).toHaveLength(1);

    const boton = screen.getByRole('button', {
      name: /Comparar disponibilidad en otras regiones/i,
    });
    expect(boton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(boton);
    expect(boton).toHaveAttribute('aria-expanded', 'false');
  });
});
