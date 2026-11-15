import { describe, expect, it, vi } from 'vitest';

vi.mock('../config/ciudadesCine.config.js', () => ({
  DIRECTORIO_CIUDADES_CINE: { configurado: false, ciudades: [] },
}));

const { listarCiudadesCine } = await import('./ciudadCine.service.js');

describe('directorio de ciudades sin cobertura verificada', () => {
  it('responde con error interno en lugar de publicar una lista vacía ficticia', () => {
    expect(() => listarCiudadesCine()).toThrow('El directorio no tiene cobertura verificada');
  });
});
