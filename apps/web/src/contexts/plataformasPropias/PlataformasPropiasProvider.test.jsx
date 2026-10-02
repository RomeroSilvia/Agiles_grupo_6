import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, request } from '../../services/api.service.js';
import { SessionProvider } from '../session/SessionProvider.jsx';
import { useSession } from '../session/SessionContext.js';
import { PlataformasPropiasProvider } from './PlataformasPropiasProvider.jsx';
import { usePlataformasPropias } from './PlataformasPropiasContext.js';

vi.mock('../../services/api.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}));

const ANA = { id: 'u1', email: 'ana@mail.com' };
const BRUNO = { id: 'u2', email: 'bruno@mail.com' };
const PROPIAS_POR_USUARIO = { [ANA.email]: [1, 2], [BRUNO.email]: [3] };
const ERROR_API = new ApiError({
  status: 500,
  code: 'DATABASE',
  message: 'Error al acceder a los datos',
});

function mockApi({ session = ANA, guardar = async () => undefined, propias } = {}) {
  let usuarioActual = session;
  request.mockImplementation(async (path, options) => {
    if (path === '/auth/session') {
      return usuarioActual ? { user: usuarioActual } : null;
    }
    if (path === '/auth/sign-in') {
      usuarioActual = [ANA, BRUNO].find(({ email }) => email === options.body.email);
      return { user: usuarioActual };
    }
    if (path === '/auth/sign-out') {
      usuarioActual = null;
      return undefined;
    }
    if (path === '/plataformas/propias') {
      return propias ? propias() : PROPIAS_POR_USUARIO[usuarioActual.email];
    }
    if (path.startsWith('/plataformas/propias/')) {
      return guardar(path, options);
    }
    throw new Error(`Ruta no esperada en el test: ${path}`);
  });
}

function Consumidor() {
  const { seleccionadas, loading, error, alternar } = usePlataformasPropias();
  const { signIn, signOut } = useSession();

  return (
    <>
      <p>
        {loading
          ? 'cargando'
          : `seleccionadas: ${[...seleccionadas].sort().join(',') || 'ninguna'}`}
      </p>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={() => alternar(3, true).catch(() => {})}>
        Agregar 3
      </button>
      <button type="button" onClick={() => alternar(1, false).catch(() => {})}>
        Quitar 1
      </button>
      <button type="button" onClick={signOut}>
        Salir
      </button>
      <button type="button" onClick={() => signIn({ email: BRUNO.email, password: 'x' })}>
        Entrar como Bruno
      </button>
    </>
  );
}

function renderConProviders() {
  render(
    <SessionProvider>
      <PlataformasPropiasProvider>
        <Consumidor />
      </PlataformasPropiasProvider>
    </SessionProvider>,
  );
}

function llamadasA(ruta) {
  return request.mock.calls.filter(([path]) => path === ruta);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('PlataformasPropiasProvider', () => {
  it('con sesión carga las plataformas del usuario', async () => {
    mockApi();
    renderConProviders();

    expect(await screen.findByText('seleccionadas: 1,2')).toBeInTheDocument();
    expect(llamadasA('/plataformas/propias')).toHaveLength(1);
  });

  it('sin sesión no pide nada y no tiene selección', async () => {
    mockApi({ session: null });
    renderConProviders();

    expect(await screen.findByText('seleccionadas: ninguna')).toBeInTheDocument();
    expect(llamadasA('/plataformas/propias')).toHaveLength(0);
  });

  it('al cerrar sesión borra la selección del usuario anterior', async () => {
    mockApi();
    const user = userEvent.setup();
    renderConProviders();
    await screen.findByText('seleccionadas: 1,2');

    await user.click(screen.getByRole('button', { name: 'Salir' }));

    expect(await screen.findByText('seleccionadas: ninguna')).toBeInTheDocument();
  });

  it('al entrar con otro usuario carga su selección y no muestra la del anterior', async () => {
    mockApi();
    const user = userEvent.setup();
    renderConProviders();
    await screen.findByText('seleccionadas: 1,2');

    await user.click(screen.getByRole('button', { name: 'Salir' }));
    await user.click(screen.getByRole('button', { name: 'Entrar como Bruno' }));

    expect(await screen.findByText('seleccionadas: 3')).toBeInTheDocument();
    expect(screen.queryByText('seleccionadas: 1,2')).not.toBeInTheDocument();
  });

  it('al alternar actualiza la selección y la guarda en la API', async () => {
    mockApi();
    const user = userEvent.setup();
    renderConProviders();
    await screen.findByText('seleccionadas: 1,2');

    await user.click(screen.getByRole('button', { name: 'Agregar 3' }));
    await user.click(screen.getByRole('button', { name: 'Quitar 1' }));

    expect(await screen.findByText('seleccionadas: 2,3')).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith('/plataformas/propias/3', { method: 'PUT' });
    expect(request).toHaveBeenCalledWith('/plataformas/propias/1', { method: 'DELETE' });
  });

  it('si no se puede guardar, deshace el cambio', async () => {
    mockApi({
      guardar: async () => {
        throw ERROR_API;
      },
    });
    const user = userEvent.setup();
    renderConProviders();
    await screen.findByText('seleccionadas: 1,2');

    await user.click(screen.getByRole('button', { name: 'Quitar 1' }));

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith('/plataformas/propias/1', { method: 'DELETE' }),
    );
    expect(await screen.findByText('seleccionadas: 1,2')).toBeInTheDocument();
  });

  it('expone el error si no se puede cargar la selección', async () => {
    mockApi({
      propias: async () => {
        throw ERROR_API;
      },
    });
    renderConProviders();

    expect(await screen.findByRole('alert')).toHaveTextContent('Error al acceder a los datos');
    expect(screen.getByText('seleccionadas: ninguna')).toBeInTheDocument();
  });
});
