import { z } from 'zod';
import { ciudadCineIdSchema, respuestaCiudadesCineSchema } from '@buscador/shared/schemas';
import { DIRECTORIO_CIUDADES_CINE } from '../config/ciudadesCine.config.js';
import { ExternalServiceError, NotFoundError, ValidationError } from '../errors/index.js';
import { ciudadCineConfiguracionSchema } from '../models/ciudadCine.model.js';

function cargarCiudadesCine() {
  if (!DIRECTORIO_CIUDADES_CINE.configurado) {
    throw new ExternalServiceError(
      'el directorio de ciudades',
      new Error('El directorio no tiene cobertura verificada'),
    );
  }

  const resultado = z
    .array(ciudadCineConfiguracionSchema)
    .safeParse(DIRECTORIO_CIUDADES_CINE.ciudades);
  if (!resultado.success) {
    throw new ExternalServiceError('el directorio de ciudades', resultado.error);
  }

  const ciudades = resultado.data;
  const ids = new Set();
  const nombresPorProvincia = new Set();
  for (const ciudad of ciudades) {
    const claveNombre = `${ciudad.provincia.toLocaleLowerCase('es-AR')}:${ciudad.nombre.toLocaleLowerCase('es-AR')}`;
    if (ids.has(ciudad.id) || nombresPorProvincia.has(claveNombre)) {
      throw new ExternalServiceError(
        'el directorio de ciudades',
        new Error('El directorio contiene ciudades duplicadas'),
      );
    }
    ids.add(ciudad.id);
    nombresPorProvincia.add(claveNombre);
  }

  return ciudades.toSorted(
    (a, b) =>
      a.provincia.localeCompare(b.provincia, 'es-AR') ||
      a.nombre.localeCompare(b.nombre, 'es-AR') ||
      a.id.localeCompare(b.id),
  );
}

export function listarCiudadesCine() {
  const ciudades = cargarCiudadesCine().map(
    ({ id, nombre, provincia, pais, zonaHoraria, cobertura, fuente }) => ({
      id,
      nombre,
      provincia,
      pais,
      zonaHoraria,
      cobertura,
      fuente,
    }),
  );

  const resultado = respuestaCiudadesCineSchema.safeParse({ pais: 'AR', ciudades });
  if (!resultado.success) {
    throw new ExternalServiceError('el directorio de ciudades', resultado.error);
  }

  return resultado.data;
}

export function obtenerCiudadCine(id) {
  const resultado = ciudadCineIdSchema.safeParse(id);
  if (!resultado.success) {
    throw new ValidationError(resultado.error);
  }

  const ciudad = cargarCiudadesCine().find((item) => item.id === resultado.data);
  if (!ciudad) {
    throw new NotFoundError('Ciudad no soportada');
  }

  return ciudad;
}
