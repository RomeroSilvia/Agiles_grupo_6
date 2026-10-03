export const USUARIO_PLATAFORMA_COLUMNS = 'plataforma_id, agregada_en';

export const USUARIO_PLATAFORMA_PRIMARY_KEY = 'usuario_id,plataforma_id';

export function fromRow(row) {
  return {
    plataformaId: row.plataforma_id,
    agregadaEn: row.agregada_en,
  };
}
