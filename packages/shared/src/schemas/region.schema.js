import { z } from 'zod';
import {
  CODIGOS_REGION_SOPORTADOS,
  MAX_REGIONES_COMPARACION,
  REGION_PATTERN,
} from '../constants/index.js';

export const regionSchema = z.string().regex(REGION_PATTERN, 'Región inválida');

export const regionSoportadaSchema = z.enum(CODIGOS_REGION_SOPORTADOS, {
  message: 'Región inválida o no soportada',
});

function normalizarEntradaRegiones(valor) {
  if (typeof valor === 'string') {
    const limpio = valor.trim();
    return limpio ? limpio.split(',').map((item) => item.trim()) : [];
  }
  if (Array.isArray(valor)) {
    return valor.flatMap((item) =>
      typeof item === 'string'
        ? item
            .split(',')
            .map((parte) => parte.trim())
            .filter(Boolean)
        : [item],
    );
  }
  return valor;
}

export const regionesComparacionSchema = z.preprocess(
  normalizarEntradaRegiones,
  z
    .array(regionSoportadaSchema, {
      message: 'Seleccioná al menos una región para comparar',
    })
    .min(1, 'Seleccioná al menos una región para comparar')
    .max(
      MAX_REGIONES_COMPARACION,
      `Solo podés comparar hasta ${MAX_REGIONES_COMPARACION} regiones a la vez`,
    )
    .transform((regiones) => [...new Set(regiones)]),
);

export const comparacionDisponibilidadQuerySchema = z
  .object({
    regiones: regionesComparacionSchema,
  })
  .strict();
