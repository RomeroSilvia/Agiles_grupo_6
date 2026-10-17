export const SINCRONIZACION_COLUMNS = 'id, iniciada_en, finalizada_en, titulos_procesados, error';

export function fromRow(row) {
  return {
    id: row.id,
    iniciadaEn: row.iniciada_en,
    finalizadaEn: row.finalizada_en,
    titulosProcesados: row.titulos_procesados,
    error: row.error,
  };
}
