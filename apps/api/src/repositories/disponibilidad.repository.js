import { supabaseAdmin } from '../config/supabase.config.js';
import { DatabaseError } from '../errors/index.js';
import {
  DISPONIBILIDAD_COLUMNS,
  DISPONIBILIDAD_PRIMARY_KEY,
  fromSnapshotRow,
} from '../models/disponibilidad.model.js';

function toRow(oferta) {
  return {
    titulo_id: oferta.tituloId,
    plataforma_id: oferta.plataformaId,
    region: oferta.region,
    tipo_oferta: oferta.tipoOferta,
    deep_link: oferta.deepLink,
    fuente_id: oferta.fuenteId,
    detectada_en: oferta.detectadaEn,
    verificada_en: oferta.verificadaEn,
    vigente: oferta.vigente,
  };
}

export async function listarPorTituloYRegion(tituloId, region) {
  const { data, error } = await supabaseAdmin
    .from('disponibilidad')
    .select(DISPONIBILIDAD_COLUMNS)
    .eq('titulo_id', tituloId)
    .eq('region', region);

  if (error) {
    throw new DatabaseError(error);
  }

  return data.map(fromSnapshotRow);
}

export async function guardarOfertas(ofertas) {
  if (ofertas.length === 0) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('disponibilidad')
    .upsert(ofertas.map(toRow), { onConflict: DISPONIBILIDAD_PRIMARY_KEY });

  if (error) {
    throw new DatabaseError(error);
  }
}
