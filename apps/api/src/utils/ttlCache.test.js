import { describe, it, expect, vi } from 'vitest';
import { createTtlCache } from './ttlCache.js';

function crearReloj(inicio = 0) {
  let ahora = inicio;
  return {
    now: () => ahora,
    avanzar: (ms) => {
      ahora += ms;
    },
  };
}

describe('createTtlCache', () => {
  it('reutiliza el valor mientras no vence', async () => {
    const reloj = crearReloj();
    const cache = createTtlCache({ ttlMs: 1000, maxEntries: 10, now: reloj.now });
    const cargar = vi.fn().mockResolvedValue('valor');

    await cache.getOrSet('clave', cargar);
    reloj.avanzar(999);
    await expect(cache.getOrSet('clave', cargar)).resolves.toBe('valor');

    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it('vuelve a cargar cuando el valor vence', async () => {
    const reloj = crearReloj();
    const cache = createTtlCache({ ttlMs: 1000, maxEntries: 10, now: reloj.now });
    const cargar = vi.fn().mockResolvedValueOnce('viejo').mockResolvedValueOnce('nuevo');

    await cache.getOrSet('clave', cargar);
    reloj.avanzar(1000);

    await expect(cache.getOrSet('clave', cargar)).resolves.toBe('nuevo');
    expect(cargar).toHaveBeenCalledTimes(2);
  });

  it('hace una sola carga para pedidos simultáneos de la misma clave', async () => {
    const cache = createTtlCache({ ttlMs: 1000, maxEntries: 10 });
    const cargar = vi.fn().mockResolvedValue('valor');

    const [primero, segundo] = await Promise.all([
      cache.getOrSet('clave', cargar),
      cache.getOrSet('clave', cargar),
    ]);

    expect(primero).toBe('valor');
    expect(segundo).toBe('valor');
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it('no guarda los errores', async () => {
    const cache = createTtlCache({ ttlMs: 1000, maxEntries: 10 });
    const cargar = vi.fn().mockRejectedValueOnce(new Error('caída')).mockResolvedValueOnce('ok');

    await expect(cache.getOrSet('clave', cargar)).rejects.toThrow('caída');
    await expect(cache.getOrSet('clave', cargar)).resolves.toBe('ok');
    expect(cargar).toHaveBeenCalledTimes(2);
  });

  it('borra las entradas más viejas al superar el máximo', async () => {
    const cache = createTtlCache({ ttlMs: 1000, maxEntries: 2 });
    const cargar = vi.fn().mockResolvedValue('valor');

    await cache.getOrSet('a', cargar);
    await cache.getOrSet('b', cargar);
    await cache.getOrSet('c', cargar);
    expect(cache.size).toBe(2);

    await cache.getOrSet('a', cargar);
    expect(cargar).toHaveBeenCalledTimes(4);
  });

  it('borra las entradas vencidas al escribir', async () => {
    const reloj = crearReloj();
    const cache = createTtlCache({ ttlMs: 1000, maxEntries: 10, now: reloj.now });
    const cargar = vi.fn().mockResolvedValue('valor');

    await cache.getOrSet('a', cargar);
    await cache.getOrSet('b', cargar);
    reloj.avanzar(1000);
    await cache.getOrSet('c', cargar);

    expect(cache.size).toBe(1);
  });
});
