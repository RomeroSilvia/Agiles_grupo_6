import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ciudadCineIdSchema } from '@buscador/shared/schemas';
import { DIRECTORIO_CIUDADES_CINE } from '../config/ciudadesCine.config.js';
import { ExternalServiceError, NotFoundError, ValidationError } from '../errors/index.js';
import { listarCiudadesCine, obtenerCiudadCine } from './ciudadCine.service.js';

vi.mock('../config/ciudadesCine.config.js', () => ({
  DIRECTORIO_CIUDADES_CINE: { configurado: true, ciudades: [] },
}));

const evidencia = {
  evidencia: 'Ciudad y provincia verificadas contra la ubicación de los cines',
  registroId: 'registro-1',
  url: null,
  consultadoEn: '2026-11-13T10:00:00.000Z',
  actualizadoEn: null,
};

function crearCiudad({ id, nombre, provincia, cobertura = 'disponible' }) {
  return {
    id,
    nombre,
    provincia,
    pais: 'AR',
    zonaHoraria: 'America/Argentina/Buenos_Aires',
    cobertura,
    fuente: {
      fuenteId: 'serpapi',
      registroId: 'registro-1',
      url: null,
      consultadoEn: evidencia.consultadoEn,
      actualizadoEn: null,
    },
    serpApiLocation: cobertura === 'disponible' ? `${nombre},Argentina` : null,
    butacaCines: [],
    evidenciaPorFuente: { serpApi: evidencia, butaca: null },
  };
}

const cordoba = crearCiudad({
  id: 'ar:550e8400-e29b-41d4-a716-446655440000',
  nombre: 'San José',
  provincia: 'Córdoba',
});
const santaFe = crearCiudad({
  id: 'ar:550e8400-e29b-41d4-a716-446655440001',
  nombre: 'San José',
  provincia: 'Santa Fe',
});
const sinCobertura = crearCiudad({
  id: 'ar:550e8400-e29b-41d4-a716-446655440002',
  nombre: 'Villa María',
  provincia: 'Córdoba',
  cobertura: 'sin_cobertura',
});

beforeEach(() => {
  DIRECTORIO_CIUDADES_CINE.ciudades = [santaFe, sinCobertura, cordoba];
});

describe('servicio de ciudades de cine', () => {
  it('lista ciudades ordenadas, permite homónimos de provincias distintas y no expone mapeos', () => {
    expect(listarCiudadesCine()).toEqual({
      pais: 'AR',
      ciudades: [
        {
          id: cordoba.id,
          nombre: cordoba.nombre,
          provincia: cordoba.provincia,
          pais: 'AR',
          zonaHoraria: cordoba.zonaHoraria,
          cobertura: 'disponible',
          fuente: cordoba.fuente,
        },
        {
          id: sinCobertura.id,
          nombre: sinCobertura.nombre,
          provincia: sinCobertura.provincia,
          pais: 'AR',
          zonaHoraria: sinCobertura.zonaHoraria,
          cobertura: 'sin_cobertura',
          fuente: sinCobertura.fuente,
        },
        {
          id: santaFe.id,
          nombre: santaFe.nombre,
          provincia: santaFe.provincia,
          pais: 'AR',
          zonaHoraria: santaFe.zonaHoraria,
          cobertura: 'disponible',
          fuente: santaFe.fuente,
        },
      ],
    });
  });

  it('devuelve una ciudad sin cobertura para que el consumidor informe su estado', () => {
    expect(obtenerCiudadCine(sinCobertura.id)).toEqual(sinCobertura);
  });

  it('distingue IDs mal formados de ciudades no soportadas', () => {
    expect(() => obtenerCiudadCine('AR')).toThrow(ValidationError);
    const idDesconocido = 'ar:550e8400-e29b-41d4-a716-446655440099';
    expect(ciudadCineIdSchema.safeParse(idDesconocido).success).toBe(true);
    expect(() => obtenerCiudadCine(idDesconocido)).toThrow(NotFoundError);
  });

  it('rechaza ciudades duplicadas para una misma provincia', () => {
    DIRECTORIO_CIUDADES_CINE.ciudades = [cordoba, { ...cordoba, id: santaFe.id }];
    expect(() => listarCiudadesCine()).toThrow(ExternalServiceError);
  });

  it('responde una lista vacía si el directorio está configurado sin ciudades verificadas', () => {
    DIRECTORIO_CIUDADES_CINE.ciudades = [];

    expect(listarCiudadesCine()).toEqual({ pais: 'AR', ciudades: [] });
  });
});
