import { TIPO_OFERTA, TIPO_TITULO } from '@buscador/shared/constants';

export const STREAMING_AVAILABILITY_CONFIG = Object.freeze({
  BASE_URL: 'https://streaming-availability.p.rapidapi.com/shows/',
  REQUEST_TIMEOUT_MS: 8000,
  MAX_REQUESTS_PER_DAY: 100,
  MAX_CONCURRENT_REQUESTS: 4,
  RUTA_POR_TIPO: Object.freeze({
    [TIPO_TITULO.PELICULA]: 'movie',
    [TIPO_TITULO.SERIE]: 'tv',
  }),
  TMDB_PROVIDER_ID_POR_SERVICIO: Object.freeze({
    netflix: 8,
    prime: 119,
    disney: 337,
    hbo: 1899,
    apple: 350,
    paramount: 531,
    crunchyroll: 283,
    mubi: 11,
  }),
  TIPO_OFERTA_POR_TIPO: Object.freeze({
    subscription: TIPO_OFERTA.SUSCRIPCION,
    free: TIPO_OFERTA.GRATIS,
    rent: TIPO_OFERTA.ALQUILER,
    buy: TIPO_OFERTA.COMPRA,
  }),
});
