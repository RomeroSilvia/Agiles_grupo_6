import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExternalLink } from './ExternalLink.jsx';

describe('ExternalLink', () => {
  it('abre en otra pestaña sin dar acceso a la página de origen', () => {
    render(<ExternalLink href="https://www.themoviedb.org">TMDB</ExternalLink>);

    const enlace = screen.getByRole('link', { name: 'TMDB' });
    expect(enlace).toHaveAttribute('href', 'https://www.themoviedb.org');
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('no deja pisar target ni rel desde afuera', () => {
    render(
      <ExternalLink href="https://www.themoviedb.org" target="_self" rel="opener">
        TMDB
      </ExternalLink>,
    );

    const enlace = screen.getByRole('link', { name: 'TMDB' });
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
