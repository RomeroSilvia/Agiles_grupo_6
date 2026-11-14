import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CINES_FIXTURE, FUNCIONES_FIXTURE } from '@buscador/shared/testing';
import { AccionSitioCine } from './AccionSitioCine.jsx';
import * as destinoCine from './destinoCine.js';

const cine = {
  ...CINES_FIXTURE[0],
  urlSitio: 'https://www.cinemark.com.ar/',
  fuentes: [{ ...CINES_FIXTURE[0].fuentes[0], fuenteId: 'butaca' }],
};
const funcion = { ...FUNCIONES_FIXTURE[0], fuentes: cine.fuentes };
afterEach(() => vi.restoreAllMocks());
describe('acción externa de cine', () => {
  it('identifica sitio general y usa un enlace accesible con apertura segura', () => {
    render(<AccionSitioCine cine={cine} funcion={funcion} />);
    const enlace = screen.getByRole('link', { name: 'Ir al sitio de Cine Central' });
    expect(enlace).toHaveAttribute('href', cine.urlSitio);
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    expect(enlace).toHaveAccessibleDescription(/Se abre un sitio externo.*Información general/);
    enlace.focus();
    expect(enlace).toHaveFocus();
    expect(screen.queryByRole('link', { name: /Ver entradas/ })).not.toBeInTheDocument();
  });
  it('muestra enlace no disponible sin href ficticio', () => {
    render(
      <AccionSitioCine cine={{ ...cine, urlSitio: 'https://evil.example/' }} funcion={funcion} />,
    );
    expect(screen.getByText('Enlace no disponible')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('renderiza la capacidad condicional de compra con un fixture validado por el contrato', () => {
    vi.spyOn(destinoCine, 'obtenerDestinoCine').mockReturnValueOnce({
      tipo: 'compra',
      url: 'https://entradas.example.org/sesion?id=1',
      etiqueta: 'Ver entradas en Cine Central',
    });
    render(<AccionSitioCine cine={cine} funcion={funcion} />);
    expect(
      screen.getByRole('link', { name: 'Ver entradas en Cine Central' }),
    ).toHaveAccessibleDescription(/Se abre un sitio externo/);
  });
});
