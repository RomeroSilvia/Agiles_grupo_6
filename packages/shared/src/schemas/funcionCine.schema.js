import { z } from 'zod';
import { tmdbIdSchema } from './busqueda.schema.js';
import {
  ciudadCineIdSchema,
  ciudadCineSchema,
  zonaHorariaCineSchema,
} from './ciudadCine.schema.js';
import { fechaCivilCarteleraSchema, fuenteSchema, sumarDiasCivil } from './cartelera.schema.js';
import { httpUrlSchema } from './url.schema.js';

export const cineIdSchema = z.string().regex(/^cine:[a-f0-9]{64}$/);
export const funcionCineIdSchema = z.string().regex(/^funcion:[a-f0-9]{64}$/);
const fuentesSchema = z.array(fuenteSchema).min(1);
const textoOpcionalSchema = z.string().trim().min(1).nullable();

export const cineSchema = z
  .object({
    id: cineIdSchema,
    ciudadId: ciudadCineIdSchema,
    nombre: z.string().trim().min(1),
    direccion: textoOpcionalSchema,
    zonaHoraria: zonaHorariaCineSchema,
    urlSitio: httpUrlSchema.nullable(),
    fuentes: fuentesSchema,
  })
  .strict();

export const funcionCineSchema = z
  .object({
    id: funcionCineIdSchema,
    tmdbId: tmdbIdSchema,
    tipo: z.literal('pelicula'),
    ciudadId: ciudadCineIdSchema,
    cineId: cineIdSchema,
    cineNombre: z.string().trim().min(1),
    inicio: z.iso.datetime({ offset: true }).regex(/[+-]\d{2}:\d{2}$/),
    fechaLocal: fechaCivilCarteleraSchema,
    horaLocal: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    zonaHoraria: zonaHorariaCineSchema,
    sala: textoOpcionalSchema,
    formato: textoOpcionalSchema,
    idioma: textoOpcionalSchema,
    subtitulos: textoOpcionalSchema,
    urlCompra: httpUrlSchema.nullable(),
    fuentes: fuentesSchema,
  })
  .strict()
  .refine((funcion) => {
    if (
      !Number.isFinite(Date.parse(funcion.inicio)) ||
      !zonaHorariaCineSchema.safeParse(funcion.zonaHoraria).success
    ) {
      return false;
    }
    const partes = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: funcion.zonaHoraria,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(new Date(funcion.inicio))
        .map(({ type, value }) => [type, value]),
    );
    return (
      funcion.fechaLocal === `${partes.year}-${partes.month}-${partes.day}` &&
      funcion.horaLocal === `${partes.hour}:${partes.minute}` &&
      funcion.inicio.startsWith(`${funcion.fechaLocal}T${funcion.horaLocal}:`)
    );
  }, 'La fecha, hora y zona de la función deben coincidir con su inicio');

export const consultaFuncionesCineSchema = z.object({ ciudadId: ciudadCineIdSchema }).strict();
export const filtrosFuncionesSchema = z
  .object({
    fecha: z.union([z.literal(''), fechaCivilCarteleraSchema]),
    cineId: z.union([z.literal(''), cineIdSchema]),
  })
  .strict();
export const parametrosFuncionesCineSchema = z.object({ tmdbId: tmdbIdSchema }).strict();

export const advertenciaFuncionesSchema = z.object({
  code: z.enum([
    'INCOMPLETE_DATA',
    'SOURCE_UNAVAILABLE',
    'QUOTA_EXHAUSTED',
    'IDENTITY_UNRESOLVED',
    'CONFLICTING_DATA',
  ]),
  message: z.string().min(1),
  fuenteId: z.string().nullable(),
});
export const respuestaFuncionesCineSchema = z
  .object({
    tmdbId: tmdbIdSchema,
    tipo: z.literal('pelicula'),
    ciudad: ciudadCineSchema,
    desde: fechaCivilCarteleraSchema,
    hasta: fechaCivilCarteleraSchema,
    cines: z.array(cineSchema),
    funciones: z.array(funcionCineSchema).max(1000),
    estado: z.enum(['disponible', 'sin_funciones', 'sin_cobertura', 'incompleta']),
    advertencias: z.array(advertenciaFuncionesSchema),
    fuentes: z.array(fuenteSchema),
    consultadoEn: z.iso.datetime(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      !fechaCivilCarteleraSchema.safeParse(data.desde).success ||
      !fechaCivilCarteleraSchema.safeParse(data.hasta).success
    ) {
      return;
    }
    const cines = new Map(data.cines.map((cine) => [cine.id, cine]));
    const ids = new Set(data.funciones.map((funcion) => funcion.id));
    const invalido =
      cines.size !== data.cines.length ||
      ids.size !== data.funciones.length ||
      data.desde > data.hasta ||
      data.hasta > sumarDiasCivil(data.desde, 7) ||
      data.cines.some(
        (cine) => cine.ciudadId !== data.ciudad.id || cine.zonaHoraria !== data.ciudad.zonaHoraria,
      ) ||
      data.funciones.some((funcion) => {
        const cine = cines.get(funcion.cineId);
        return (
          !cine ||
          funcion.tmdbId !== data.tmdbId ||
          funcion.ciudadId !== data.ciudad.id ||
          funcion.cineNombre !== cine.nombre ||
          funcion.zonaHoraria !== cine.zonaHoraria ||
          funcion.fechaLocal < data.desde ||
          funcion.fechaLocal > data.hasta
        );
      }) ||
      (['sin_funciones', 'sin_cobertura'].includes(data.estado) && data.funciones.length > 0) ||
      (data.estado === 'disponible' &&
        (data.funciones.length === 0 || data.advertencias.length > 0));
    if (invalido)
      ctx.addIssue({
        code: 'custom',
        message: 'Las funciones deben ser coherentes con la película, ciudad, horizonte y cines',
      });
  });
