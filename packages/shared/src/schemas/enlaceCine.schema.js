import { z } from 'zod';
import { FUENTE_ID_BUTACA, URL_SITIO_CINEMARK } from '../constants/cartelera.constants.js';
import { httpUrlSchema } from './url.schema.js';
import { cineIdSchema, funcionCineIdSchema } from './funcionCine.schema.js';
import { tmdbIdSchema } from './busqueda.schema.js';

const reglasSchema = z.array(
  z
    .object({
      tipo: z.enum(['sitio', 'compra']),
      fuenteId: z.string().min(1),
      url: httpUrlSchema,
      cineId: cineIdSchema.nullable(),
      funcionId: funcionCineIdSchema.nullable(),
      tmdbId: tmdbIdSchema.nullable(),
      permitirHttp: z.boolean().default(false),
      evidencia: z.string().trim().min(1),
    })
    .strict()
    .refine(
      (regla) =>
        regla.tipo !== 'compra' || Boolean(regla.cineId && regla.funcionId && regla.tmdbId),
      'Una compra requiere correspondencia explícita con cine y función',
    ),
);

function tieneControles(valor, incluirEspacios = false) {
  return [...valor].some((caracter) => {
    const codigo = caracter.codePointAt(0);
    return (
      codigo <= (incluirEspacios ? 32 : 31) || (codigo >= 127 && codigo <= 159) || caracter === '\\'
    );
  });
}

function esSeguro(valor, reglas) {
  // Se autorizan destinos completos: no se aceptan variantes de path ni query.
  if (!URL.canParse(valor)) return false;
  return reglas.some((regla) => new URL(regla.url).href === new URL(valor).href);
}

function esReglaSegura(regla) {
  const url = new URL(regla.url);
  return (
    !url.username &&
    !url.password &&
    !url.port &&
    !url.hash &&
    (url.protocol === 'https:' || (url.protocol === 'http:' && regla.permitirHttp)) &&
    !tieneControles(regla.url, true) &&
    !/^(?:localhost|[\d.]+)$/.test(url.hostname) &&
    !url.hostname.includes(':') &&
    !/\/(?:redirect|redir|go|out|url|jump)(?:[/._-]|$)/i.test(url.pathname) &&
    ![...url.searchParams].some(
      ([key, value]) =>
        /(?:token|secret|password|authorization|api[_-]?key|url|redirect|return|next|continue|target|dest|callback)/i.test(
          key,
        ) || /(?:https?:|javascript:|data:|\/\/)/i.test(value),
    )
  );
}

export function crearPoliticaEnlacesCine(reglasRevisadas) {
  const reglas = reglasSchema.parse(reglasRevisadas).filter(esReglaSegura);
  // Se inspecciona el texto original antes de que Zod normalice una URL.
  const schema = z
    .string()
    .refine(
      (valor) => valor.trim() === valor && !tieneControles(valor, true),
      'El enlace contiene caracteres no permitidos',
    )
    .pipe(httpUrlSchema)
    .refine((valor) => esSeguro(valor, reglas), 'El destino del cine no está autorizado');
  function validar(url, { cine, funcion, tipo }) {
    if (!schema.safeParse(url).success || !cineIdSchema.safeParse(cine?.id).success) return null;
    if (funcion && (funcion.cineId !== cine.id || funcion.ciudadId !== cine.ciudadId)) return null;
    const autorizada = reglas.find(
      (regla) =>
        regla.tipo === tipo &&
        new URL(regla.url).href === new URL(url).href &&
        (new URL(url).protocol === 'https:' || regla.permitirHttp) &&
        (regla.cineId === null || regla.cineId === cine.id) &&
        (regla.funcionId === null || regla.funcionId === funcion?.id) &&
        (regla.tmdbId === null || regla.tmdbId === funcion?.tmdbId) &&
        cine.fuentes?.some((fuente) => fuente.fuenteId === regla.fuenteId) &&
        (tipo !== 'compra' ||
          funcion?.fuentes?.some((fuente) => fuente.fuenteId === regla.fuenteId)),
    );
    return autorizada ? url : null;
  }
  return { schema, validar };
}

// Únicamente la home oficial de la cadena, comprobada el 14/11/2026. No es checkout.
// No hay destinos de compra revisados habilitados. Ver docs/cine.md.
const politica = crearPoliticaEnlacesCine([
  {
    tipo: 'sitio',
    fuenteId: FUENTE_ID_BUTACA,
    url: URL_SITIO_CINEMARK,
    cineId: null,
    funcionId: null,
    tmdbId: null,
    permitirHttp: false,
    evidencia: 'Sitio oficial Cinemark y links.ts de Butaca; revisión 2026-11-14',
  },
]);
export const enlaceCineSchema = politica.schema;
export const validarEnlaceCine = politica.validar;
