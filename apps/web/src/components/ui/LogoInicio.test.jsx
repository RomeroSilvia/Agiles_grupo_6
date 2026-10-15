import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { APP_NAME } from '../../config/app.config.js';
import { LogoInicio } from './LogoInicio.jsx';

function renderLogoInicio(props) {
  return render(
    <MemoryRouter>
      <LogoInicio {...props} />
    </MemoryRouter>,
  );
}

describe('LogoInicio', () => {
  it('enlaza al inicio con el logo y un nombre accesible', () => {
    renderLogoInicio();

    const inicio = screen.getByRole('link', { name: `${APP_NAME}, ir al inicio` });
    expect(inicio).toHaveAttribute('href', '/');
    expect(inicio).toHaveTextContent(APP_NAME);
  });

  it('suma las clases que recibe', () => {
    renderLogoInicio({ className: 'lg:hidden' });

    expect(screen.getByRole('link')).toHaveClass('lg:hidden', 'inline-flex');
  });
});
