import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import {
  VERIFICACION_DISPONIBILIDAD_COLUMNS,
  fromRow,
} from '../models/verificacionDisponibilidad.model.js';

const TAMANO_LOTE_TITULOS = 500;
const TAMANO_PAGINA = 1000;

export async function listarPorTitulos(tituloIds) {
  const idsUnicos = [...new Set(tituloIds)];
  const verificaciones = [];

  for (let inicioLote = 0; inicioLote < idsUnicos.length; inicioLote += TAMANO_LOTE_TITULOS) {
    const lote = idsUnicos.slice(inicioLote, inicioLote + TAMANO_LOTE_TITULOS);
    let desde = 0;

    while (true) {
      const { data, error } = await supabaseAdmin
        .from('verificacion_disponibilidad')
        .select(VERIFICACION_DISPONIBILIDAD_COLUMNS)
        .in('titulo_id', lote)
        .order('titulo_id')
        .order('region')
        .range(desde, desde + TAMANO_PAGINA - 1);

      if (error) {
        throw new DatabaseError(error);
      }

      const pagina = data ?? [];
      verificaciones.push(...pagina.map(fromRow));

      if (pagina.length < TAMANO_PAGINA) {
        break;
      }

      desde += TAMANO_PAGINA;
    }
  }

  return verificaciones;
}

export async function registrar({ tituloId, region, regionPredeterminada }) {
  const { data, error } = await supabaseAdmin.rpc('registrar_verificacion_disponibilidad', {
    p_titulo_id: tituloId,
    p_region: region,
    p_region_predeterminada: regionPredeterminada,
  });

  if (error) {
    throw new DatabaseError(error);
  }

  return data;
}
