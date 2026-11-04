import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { BackLink } from './BackLink.jsx';

function renderBackLink(props) {
  return render(
    <MemoryRouter>
      <BackLink to="/perfil" {...props}>
        Volver al perfil
      </BackLink>
    </MemoryRouter>,
  );
}

describe('BackLink', () => {
  it('enlaza a la ruta pedida y pasa los eventos', () => {
    const onClick = vi.fn();
    renderBackLink({ onClick });

    const enlace = screen.getByRole('link', { name: 'Volver al perfil' });
    expect(enlace).toHaveAttribute('href', '/perfil');

    fireEvent.click(enlace);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no deja pisar sus clases desde afuera', () => {
    renderBackLink({ className: 'text-danger' });

    const enlace = screen.getByRole('link', { name: 'Volver al perfil' });
    expect(enlace).toHaveClass('text-link');
    expect(enlace).not.toHaveClass('text-danger');
  });
});
