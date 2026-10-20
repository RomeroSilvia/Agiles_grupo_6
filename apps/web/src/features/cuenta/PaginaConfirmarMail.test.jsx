import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { ApiError, request } from '../../services/api.service.js';
import { renderRoute } from '../../test/renderRoute.jsx';

vi.mock('../../services/api.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  request: vi.fn(),
}));

const TOKEN = 'token-del-enlace';
const NUEVO_EMAIL = 'nuevo@mail.com';

function mockApi({ confirmar = async () => ({ email: NUEVO_EMAIL }) } = {}) {
  request.mockImplementation(async (path, options) => {
    if (path === '/auth/session') {
      return null;
    }
    if (path === '/region') {
      return { region: 'AR' };
    }
    if (path === '/auth/email-change/confirm') {
      return confirmar(options);
    }
    throw new Error(`Ruta no esperada en el test: ${path}`);
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockApi();
});

describe('Confirmar el mail nuevo', () => {
  it('confirma el cambio con el token del enlace', async () => {
    renderRoute(`/confirmar-mail#token=${TOKEN}`);

    expect(
      await screen.findByRole('heading', { name: 'Tu mail se actualizó' }),
    ).toBeInTheDocument();
    expect(screen.getByText(NUEVO_EMAIL)).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith('/auth/email-change/confirm', {
      method: 'POST',
      body: { token: TOKEN },
    });
    expect(
      request.mock.calls.filter(([path]) => path === '/auth/email-change/confirm'),
    ).toHaveLength(1);
  });

  it('si el enlace venció avisa que el mail no cambió', async () => {
    mockApi({
      confirmar: async () => {
        throw new ApiError({ status: 400, code: 'INVALID_LINK', message: 'El enlace venció' });
      },
    });
    renderRoute(`/confirmar-mail#token=${TOKEN}`);

    expect(
      await screen.findByRole('heading', { name: 'El enlace venció o ya se usó' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tu mail no cambió/)).toBeInTheDocument();
  });
});
