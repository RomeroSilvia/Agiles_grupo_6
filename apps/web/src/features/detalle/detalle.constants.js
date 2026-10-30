import { NOMBRES_REGION, TIPO_OFERTA } from '@buscador/shared/constants';

export const ETIQUETAS_OFERTA = Object.freeze({
  [TIPO_OFERTA.SUSCRIPCION]: 'Suscripción',
  [TIPO_OFERTA.GRATIS]: 'Gratis',
  [TIPO_OFERTA.CON_ANUNCIOS]: 'Gratis con anuncios',
  [TIPO_OFERTA.ALQUILER]: 'Alquiler',
  [TIPO_OFERTA.COMPRA]: 'Compra',
});

export function formatearNombreRegion(codigo) {
  const nombre = NOMBRES_REGION[codigo];
  return nombre ? `${nombre} (${codigo})` : codigo;
}

export function marcarPlataformasPropias(ofertas, { distinguirPropias, seleccionadas }) {
  return ofertas.map(({ tipoOferta, plataformas }) => ({
    tipoOferta,
    plataformas: plataformas
      .map((plataforma) => ({
        plataforma,
        esPropia: !distinguirPropias || seleccionadas.has(plataforma.id),
      }))
      .sort((a, b) => Number(b.esPropia) - Number(a.esPropia)),
  }));
}
