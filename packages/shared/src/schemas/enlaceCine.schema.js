import { z } from 'zod';
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

function decodificar(valor) {
  let actual = valor;
  for (let intento = 0; intento < 3; intento += 1) {
    try {
      const siguiente = decodeURIComponent(actual);
      if (siguiente === actual) break;
      actual = siguiente;
    } catch {
      return '';
    }
  }
  return actual;
}

function tieneControles(valor, incluirEspacios = false) {
  return [...valor].some((caracter) => {
    const codigo = caracter.codePointAt(0);
    return (
      codigo <= (incluirEspacios ? 32 : 31) || (codigo >= 127 && codigo <= 159) || caracter === '\\'
    );
  });
}

function esSeguro(valor, reglas) {
  if (typeof valor !== 'string' || valor.trim() !== valor || tieneControles(valor, true))
    return false;
  const resultado = httpUrlSchema.safeParse(valor);
  if (!resultado.success) return false;
  const url = new URL(valor);
  if (url.username || url.password || url.port || url.hash) return false;
  const host = url.hostname;
  if (
    host === 'localhost' ||
    /(?:^|\.)(?:localhost|local|internal|lan|home)$/.test(host) ||
    /^[\d.]+$/.test(host) ||
    host.includes(':') ||
    host.includes('[') ||
    host.includes(']')
  )
    return false;
  if (
    !reglas.some(
      (regla) =>
        new URL(regla.url).hostname === host &&
        (url.protocol === 'https:' || (url.protocol === 'http:' && regla.permitirHttp)),
    )
  )
    return false;
  const path = decodificar(url.pathname);
  if (
    !path ||
    tieneControles(decodificar(valor)) ||
    /\/(?:redirect|redir|go|out|url|jump)(?:[/._-]|$)/i.test(path)
  )
    return false;
  for (const [key, value] of url.searchParams) {
    if (
      /(?:token|secret|password|authorization|api[_-]?key)/i.test(key) ||
      /^(?:url|redirect|return|next|continue|target|dest|callback)/i.test(key) ||
      /(?:https?:|javascript:|data:|\/\/)/i.test(decodificar(value))
    )
      return false;
  }
  return reglas.some(
    (regla) =>
      new URL(regla.url).href === url.href && (url.protocol === 'https:' || regla.permitirHttp),
  );
}

export function crearPoliticaEnlacesCine(reglasRevisadas) {
  const reglas = reglasSchema.parse(reglasRevisadas);
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
    fuenteId: 'butaca',
    url: 'https://www.cinemark.com.ar/',
    cineId: null,
    funcionId: null,
    tmdbId: null,
    permitirHttp: false,
    evidencia: 'Sitio oficial Cinemark y links.ts de Butaca; revisión 2026-11-14',
  },
]);
export const enlaceCineSchema = politica.schema;
export const validarEnlaceCine = politica.validar;
