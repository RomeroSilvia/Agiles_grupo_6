import { consultaEventosSchema, respuestaEventosSchema } from '@buscador/shared/schemas';
import { request } from '../../services/api.service.js';

export async function listarEventos({ signal, ...consulta }) {
  const params = consultaEventosSchema.parse(consulta);
  const data = await request('/eventos', { params, signal });
  const resultado = respuestaEventosSchema.safeParse(data);
  if (!resultado.success) {
    throw new Error('No pudimos interpretar los eventos recibidos. Probá de nuevo.');
  }
  return resultado.data;
}
