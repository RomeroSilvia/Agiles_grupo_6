import { describe, it, expect, vi, afterEach } from 'vitest';
import { getRegionByIp } from './geoip.integration.js';

afterEach(() => vi.unstubAllGlobals());

describe('geoip.integration', () => {
  it('consulta por HTTPS y normaliza el país a ISO alfa-2', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ip: '8.8.8.8', country: 'us' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getRegionByIp('::ffff:8.8.8.8')).resolves.toBe('US');
    expect(fetchMock.mock.calls[0][0].toString()).toBe('https://api.country.is/8.8.8.8');
  });

  it('no consulta IPs locales y devuelve null si no hay país', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getRegionByIp('127.0.0.1')).resolves.toBeNull();
    await expect(getRegionByIp('::1')).resolves.toBeNull();
    await expect(getRegionByIp('8.8.8.8')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('no envía IPs privadas o reservadas al servicio externo', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    for (const ip of [
      '10.1.2.3',
      '172.16.0.1',
      '192.168.1.1',
      '169.254.1.1',
      '100.64.0.1',
      '192.0.2.1',
      '::ffff:10.1.2.3',
      '::ffff:a01:203',
      'fc00::1',
      'fe80::1',
      '2001:db8::1',
      '::',
      'IP inválida',
    ]) {
      await expect(getRegionByIp(ip)).resolves.toBeNull();
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('trata un código inválido como región no detectable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ country: 'desconocido' }) }),
    );
    await expect(getRegionByIp('8.8.8.8')).resolves.toBeNull();
  });

  it('convierte un fallo de red en un error de servicio externo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin conexión')));
    await expect(getRegionByIp('8.8.8.8')).rejects.toMatchObject({ code: 'EXTERNAL_SERVICE' });
  });
});
