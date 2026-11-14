import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { request } from '../../services/api.service.js';
import { renderRoute } from '../../test/renderRoute.jsx';

vi.mock('../../services/api.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}));

const USUARIO = { id: 'u1', email: 'ana@mail.com', esAdmin: false };
const ADMIN = { id: 'u2', email: 'admin@mail.com', esAdmin: true };

function mockApi({ user }) {
  request.mockImplementation(async (path) => {
    if (path === '/auth/session') {
      return user ? { user } : null;
    }
    if (path === '/region') {
      return { region: 'AR', source: 'ip' };
    }
    if (path === '/plataformas' || path === '/plataformas/propias') {
      return [];
    }
    throw new Error(`Ruta no esperada en el test: ${path}`);
  });
}

function esperarSesion(user) {
  return screen.findByRole('button', { name: `Menú de la cuenta de ${user.email}` });
}

function navPrincipal() {
  return screen.getByRole('navigation', { name: 'Principal' });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Acceso al panel de administración', () => {
  it('el admin ve «Administración» en la nav y en el menú de celular, y el chip ADMIN', async () => {
    mockApi({ user: ADMIN });
    renderRoute('/');
    await esperarSesion(ADMIN);

    expect(within(navPrincipal()).getByRole('link', { name: 'Administración' })).toHaveAttribute(
      'href',
      '/admin',
    );
    expect(screen.getByText('Admin')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const menu = screen.getByRole('navigation', { name: 'Menú' });
    expect(within(menu).getByRole('link', { name: 'Administración' })).toBeInTheDocument();
  });

  it('un usuario común no ve «Administración» ni en la nav ni en el menú de celular', async () => {
    mockApi({ user: USUARIO });
    renderRoute('/');
    await esperarSesion(USUARIO);

    expect(
      within(navPrincipal()).queryByRole('link', { name: 'Administración' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const menu = screen.getByRole('navigation', { name: 'Menú' });
    expect(within(menu).queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
  });

  it('sin sesión no aparece «Administración» y la ruta del panel lleva a iniciar sesión', async () => {
    mockApi({ user: null });
    const router = renderRoute('/admin/metricas');

    await waitFor(() => expect(router.state.location.pathname).toBe('/iniciar-sesion'));
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
  });

  it('un usuario común que entra a la ruta del panel ve el error de acceso', async () => {
    mockApi({ user: USUARIO });
    renderRoute('/admin/metricas');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No tenés acceso a esta sección' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Métricas' })).not.toBeInTheDocument();
  });

  it('el admin entra a /admin, va a Métricas y puede pasar a Usuarios', async () => {
    mockApi({ user: ADMIN });
    const router = renderRoute('/admin');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Panel de administración' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/metricas');

    const pestanas = screen.getByRole('navigation', { name: 'Panel de administración' });
    expect(within(pestanas).getByRole('link', { name: 'Métricas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText(/Resumen de la actividad en/)).toBeInTheDocument();

    await userEvent.click(within(pestanas).getByRole('link', { name: 'Usuarios' }));

    expect(router.state.location.pathname).toBe('/admin/usuarios');
    expect(within(pestanas).getByRole('link', { name: 'Usuarios' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText(/Usuarios registrados en/)).toBeInTheDocument();
  });
});
