import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../app/router.js';
import { ThemeProvider } from '../contexts/theme/ThemeProvider.jsx';
import { SessionProvider } from '../contexts/session/SessionProvider.jsx';
import { RegionProvider } from '../contexts/region/RegionProvider.jsx';
import { PlataformasPropiasProvider } from '../contexts/plataformasPropias/PlataformasPropiasProvider.jsx';

/** Renderiza la app completa en una ruta, con los mismos providers que main.jsx. */
export function renderRoute(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <ThemeProvider>
      <SessionProvider>
        <RegionProvider>
          <PlataformasPropiasProvider>
            <RouterProvider router={router} />
          </PlataformasPropiasProvider>
        </RegionProvider>
      </SessionProvider>
    </ThemeProvider>,
  );
  return router;
}
