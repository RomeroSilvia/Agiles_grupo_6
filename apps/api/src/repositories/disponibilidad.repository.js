import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import {
  DISPONIBILIDAD_COLUMNS,
  DISPONIBILIDAD_PRIMARY_KEY,
  fromRow,
  toDeepLinkRow,
  toSnapshotRow,
} from '../models/disponibilidad.model.js';

export async function listarPorTituloYRegion(tituloId, region) {
  const { data, error } = await supabaseAdmin
    .from('disponibilidad')
    .select(DISPONIBILIDAD_COLUMNS)
    .eq('titulo_id', tituloId)
    .eq('region', region);

  if (error) {
    throw new DatabaseError(error);
  }

  return data.map(fromRow);
}

export async function guardarOfertas(ofertas) {
  if (ofertas.length === 0) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('disponibilidad')
    .upsert(ofertas.map(toSnapshotRow), { onConflict: DISPONIBILIDAD_PRIMARY_KEY });

  if (error) {
    throw new DatabaseError(error);
  }
}

export async function guardarDeepLinks(disponibilidades) {
  const { error } = await supabaseAdmin
    .from('disponibilidad')
    .upsert(disponibilidades.map(toDeepLinkRow), { onConflict: DISPONIBILIDAD_PRIMARY_KEY });

  if (error) {
    throw new DatabaseError(error);
  }
}
