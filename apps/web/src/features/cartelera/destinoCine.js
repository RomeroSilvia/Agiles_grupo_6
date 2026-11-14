import { validarEnlaceCine } from '@buscador/shared/schemas';

export function obtenerDestinoCine({ cine, funcion }, validar = validarEnlaceCine) {
  const compra = validar(funcion.urlCompra, { cine, funcion, tipo: 'compra' });
  if (compra) return { url: compra, tipo: 'compra', etiqueta: `Ver entradas en ${cine.nombre}` };
  const sitio = validar(cine.urlSitio, { cine, funcion, tipo: 'sitio' });
  return sitio ? { url: sitio, tipo: 'sitio', etiqueta: `Ir al sitio de ${cine.nombre}` } : null;
}
