import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { ThemeProvider } from './contexts/theme/ThemeProvider.jsx';
import { SessionProvider } from './contexts/session/SessionProvider.jsx';
import { RegionProvider } from './contexts/region/RegionProvider.jsx';
import { router } from './app/router.js';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SessionProvider>
        <RegionProvider>
          <RouterProvider router={router} />
        </RegionProvider>
      </SessionProvider>
    </ThemeProvider>
  </StrictMode>,
);
